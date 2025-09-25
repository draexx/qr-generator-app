# QR Code Generator

Una aplicación moderna para generar códigos QR personalizables con soporte para múltiples tipos de contenido.

## Características

- Generación de códigos QR para diferentes tipos de contenido:
  - URLs
  - Texto plano
  - Tarjetas de contacto (vCard)
  - Redes WiFi
  - Correos electrónicos
  - Mensajes de texto (SMS)
  - Ubicaciones geográficas
- Personalización avanzada:
  - Colores personalizables (fondo y primer plano)
  - Diferentes estilos de puntos
  - Inclusión de logo
  - Tamaño ajustable
- Interfaz de usuario intuitiva y responsiva
- Modo oscuro
- Vista previa en tiempo real
- Descarga en múltiples formatos (PNG, JPEG, SVG, WebP)

## Tecnologías utilizadas

- [React](https://reactjs.org/) - Biblioteca de JavaScript para construir interfaces de usuario
- [TypeScript](https://www.typescriptlang.org/) - JavaScript tipado para mayor robustez
- [Vite](https://vitejs.dev/) - Herramienta de construcción y desarrollo
- [Tailwind CSS](https://tailwindcss.com/) - Framework de utilidades CSS
- [react-qr-code](https://www.npmjs.com/package/react-qr-code) - Generación de códigos QR
- [react-icons](https://react-icons.github.io/react-icons/) - Iconos populares en forma de componentes React

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tuusuario/qr-generator.git
   cd qr-generator
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o
   yarn
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   # o
   yarn dev
   ```

4. Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## Uso

1. Selecciona el tipo de código QR que deseas generar
2. Completa los campos del formulario según el tipo seleccionado
3. Personaliza la apariencia usando el panel de personalización
4. Descarga tu código QR en el formato que prefieras

## Construcción para producción

Para crear una versión optimizada para producción:

```bash
npm run build
# o
yarn build

Los archivos de producción se generarán en la carpeta `dist`.

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más información.
