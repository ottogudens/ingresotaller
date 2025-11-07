### **Manual de Despliegue de Aplicación Flask con MySQL en Ubuntu 24.04**

Este manual te guiará a través del proceso completo para desplegar tu aplicación web Python/Flask, utilizando Gunicorn como servidor de aplicación, Nginx como proxy inverso y MySQL como base de datos.

---

### **Paso 1: Preparación del Servidor Ubuntu 24.04**

Primero, necesitas conectar a tu servidor vía SSH y preparar el entorno con todo el software necesario.

1.  **Actualizar el sistema:**
    Asegúrate de que todos los paquetes del sistema estén actualizados.
    ```bash
    sudo apt update
    sudo apt upgrade -y
    ```

2.  **Instalar paquetes necesarios:**
    Instalaremos Python, `pip`, `venv`, Nginx, Gunicorn y el servidor de MySQL.
    ```bash
    sudo apt install python3-pip python3-venv nginx gunicorn mysql-server -y
    ```

3.  **Configurar y asegurar MySQL:**
    Ejecuta el script de instalación segura para establecer una contraseña para el usuario `root` y eliminar configuraciones inseguras.
    ```bash
    sudo mysql_secure_installation
    ```
    *Se te pedirá configurar el "Validate Password Component", puedes elegir no activarlo. Lo más importante es **establecer una contraseña segura para el usuario root**.*

4.  **Crear la base de datos y el usuario:**
    Ahora, entra a la consola de MySQL para crear la base de datos y el usuario que tu aplicación utilizará.
    ```bash
    sudo mysql
    ```
    Dentro de la consola de MySQL, ejecuta los siguientes comandos. Reemplaza `'tu_usuario_db'`, `'tu_base_de_datos'` y `'tu_contraseña_segura'` con tus propios valores.
    ```sql
    CREATE DATABASE tu_base_de_datos;
    CREATE USER 'tu_usuario_db'@'localhost' IDENTIFIED BY 'tu_contraseña_segura';
    GRANT ALL PRIVILEGES ON tu_base_de_datos.* TO 'tu_usuario_db'@'localhost';
    FLUSH PRIVILEGES;
    EXIT;
    ```

5.  **Configurar el Firewall:**
    Permitiremos el tráfico a través de Nginx.
    ```bash
    sudo ufw allow 'Nginx Full'
    sudo ufw enable
    ```

---

### **Paso 2: Subir y Configurar la Aplicación**

1.  **Clonar o subir tu proyecto:**
    Sube tus archivos a un directorio como `/home/ubuntu/my-flask-app`.
    ```bash
    git clone <tu-repositorio-git> /home/ubuntu/my-flask-app
    cd /home/ubuntu/my-flask-app
    ```

2.  **Crear y Activar un Entorno Virtual:**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3.  **Instalar Dependencias:**
    Instala las librerías de Python desde tu archivo `requirements.txt`.
    ```bash
    pip install -r requirements.txt
    ```

4.  **Crear el archivo de entorno `.env`:**
    Tu aplicación usa un archivo `.env` para manejar las credenciales de la base de datos. Créalo ahora.
    ```bash
    nano .env
    ```
    Pega el siguiente contenido, **usando los valores que creaste en el paso de MySQL:**
    ```
    DATABASE_USER=tu_usuario_db
    DATABASE_PASSWORD=tu_contraseña_segura
    DATABASE_HOST=localhost
    DATABASE_NAME=tu_base_de_datos
    ```
    Guarda y cierra el archivo (Ctrl+X, Y, Enter).

---

### **Paso 3: Crear un Servicio `systemd` para Gunicorn**

1.  **Crear el archivo de servicio:**
    ```bash
    sudo nano /etc/systemd/system/my-flask-app.service
    ```

2.  **Pegar la siguiente configuración:**
    Esta versión incluye la directiva `EnvironmentFile` para cargar las variables desde tu `.env`.
    ```ini
    [Unit]
    Description=Gunicorn instance to serve my-flask-app
    After=network.target

    [Service]
    User=ubuntu
    Group=www-data
    WorkingDirectory=/home/ubuntu/my-flask-app
    Environment="PATH=/home/ubuntu/my-flask-app/.venv/bin"
    EnvironmentFile=/home/ubuntu/my-flask-app/.env
    ExecStart=/home/ubuntu/my-flask-app/.venv/bin/gunicorn --workers 3 --bind unix:my-flask-app.sock -m 007 main:app

    [Install]
    WantedBy=multi-user.target
    ```

3.  **Iniciar y habilitar el servicio:**
    ```bash
    sudo systemctl start my-flask-app
    sudo systemctl enable my-flask-app
    ```

4.  **Verificar el estado del servicio:**
    ```bash
    sudo systemctl status my-flask-app
    ```
    Deberías ver un estado `active (running)`.

---

### **Paso 4: Configurar Nginx como Proxy Inverso**

1.  **Crear un archivo de configuración de Nginx:**
    ```bash
    sudo nano /etc/nginx/sites-available/my-flask-app
    ```

2.  **Pegar la siguiente configuración:**
    Reemplaza `tu_dominio_o_ip` con la IP de tu servidor o tu dominio.
    ```nginx
    server {
        listen 80;
        server_name tu_dominio_o_ip;

        location / {
            include proxy_params;
            proxy_pass http://unix:/home/ubuntu/my-flask-app/my-flask-app.sock;
        }
    }
    ```

3.  **Habilitar la configuración y reiniciar Nginx:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/my-flask-app /etc/nginx/sites-enabled
    sudo nginx -t
    sudo systemctl restart nginx
    ```

---

### **Paso 5: Acceder a tu aplicación**

¡Todo está listo! Abre tu navegador y visita la dirección IP de tu servidor o tu dominio.

`http://tu_dominio_o_ip`

Deberías ver la página `index.html` de tu aplicación. El sistema de inicio de sesión y registro debería funcionar, conectándose y guardando los datos en la base de datos MySQL que configuraste.

---

### **Solución de Problemas (Troubleshooting)**

*   **Error 502 Bad Gateway:** Significa que Nginx no puede comunicarse con Gunicorn.
    *   Verifica el estado del servicio: `sudo systemctl status my-flask-app`.
    *   Revisa los logs de Gunicorn: `sudo journalctl -u my-flask-app`.

*   **Errores de base de datos (`(MySQLdb._exceptions.OperationalError)`):**
    *   Asegúrate de que el servicio de MySQL esté corriendo: `sudo systemctl status mysql`.
    *   Verifica que las credenciales en tu archivo `.env` son correctas.
    *   Confirma que el usuario de la base de datos tiene los privilegios correctos.
