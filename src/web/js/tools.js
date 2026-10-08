export const CATEGORIES = [
  {
    id: "image",
    icon: "🖼️",
    label: { es: "Imagen", en: "Image" },
    tools: ["optimize", "resize", "crop", "beautify", "watermark", "palette", "favicon", "imagecompare", "svgoptimize", "imageformat"]
  },
  {
    id: "design",
    icon: "🎨",
    label: { es: "Diseño", en: "Design" },
    tools: ["gradient", "color", "shadow", "eyedropper"]
  },
  {
    id: "text",
    icon: "🔤",
    label: { es: "Texto y Código", en: "Text & Code" },
    tools: ["wordcount", "caseconv", "textlines", "findreplace", "textdiff", "markdown", "json", "regex", "lorem"]
  },
  {
    id: "dev",
    icon: "🔧",
    label: { es: "Desarrollo", en: "Development" },
    tools: ["hash", "password", "uuid", "qr", "imgbase64", "timestamp", "jwt", "urlparse"]
  },
  {
    id: "ai",
    icon: "💡",
    label: { es: "IA", en: "AI" },
    tools: ["aiprompts", "secrets", "splitter", "tokens"]
  }
];

export const TOOLS = {
  optimize: {
    icon: "🖼️",
    title: { es: "Optimizador de imágenes", en: "Image optimizer" },
    desc: { es: "Comprime y convierte a WebP, PNG o JPEG.", en: "Compress and convert to WebP, PNG or JPEG." },
    module: "./tools/optimize.js"
  },
  resize: {
    icon: "📐",
    title: { es: "Redimensionar imágenes", en: "Resize images" },
    desc: { es: "Cambia el tamaño por píxeles o porcentaje.", en: "Resize by pixels or percentage." },
    module: "./tools/resize.js"
  },
  crop: {
    icon: "✂️",
    title: { es: "Recortar y girar", en: "Crop & rotate" },
    desc: { es: "Recorta, gira y voltea imágenes.", en: "Crop, rotate and flip images." },
    module: "./tools/crop.js"
  },
  watermark: {
    icon: "💧",
    title: { es: "Marca de agua", en: "Watermark" },
    desc: { es: "Añade texto de marca de agua a tus imágenes.", en: "Add text watermarks to your images." },
    module: "./tools/watermark.js"
  },
  beautify: {
    icon: "✨",
    title: { es: "Embellecer capturas", en: "Beautify screenshots" },
    desc: { es: "Fondos, sombras y esquinas redondeadas.", en: "Backgrounds, shadows and rounded corners." },
    module: "./tools/beautify.js"
  },
  palette: {
    icon: "🎨",
    title: { es: "Extractor de colores", en: "Color extractor" },
    desc: { es: "Obtén la paleta dominante de una imagen.", en: "Get the dominant palette of an image." },
    module: "./tools/palette.js"
  },
  favicon: {
    icon: "🔖",
    title: { es: "Generador de favicon", en: "Favicon generator" },
    desc: { es: "Multi-tamaño PNG, .ico y snippet de manifest.", en: "Multi-size PNG, .ico and manifest snippet." },
    module: "./tools/favicon.js"
  },
  imagecompare: {
    icon: "🆚",
    title: { es: "Comparador de imágenes", en: "Image compare" },
    desc: { es: "Compara dos imágenes A/B con deslizador.", en: "Compare two images A/B with a slider." },
    module: "./tools/imagecompare.js"
  },
  svgoptimize: {
    icon: "🧩",
    title: { es: "Optimizador SVG", en: "SVG optimizer" },
    desc: { es: "Minifica archivos SVG y reduce su peso.", en: "Minify SVG files and reduce size." },
    module: "./tools/svgoptimize.js"
  },
  imageformat: {
    icon: "🔄",
    title: { es: "Convertidor de formato", en: "Format converter" },
    desc: { es: "Convierte AVIF, BMP o GIF a WebP, PNG o JPEG.", en: "Convert AVIF, BMP or GIF to WebP, PNG or JPEG." },
    module: "./tools/imageformat.js"
  },
  eyedropper: {
    icon: "💧",
    title: { es: "Cuentagotas", en: "Eyedropper" },
    desc: { es: "Captura el color exacto de cualquier píxel.", en: "Pick the exact color of any pixel." },
    module: "./tools/eyedropper.js"
  },
  imgbase64: {
    icon: "🔗",
    title: { es: "Imagen a Base64", en: "Image to Base64" },
    desc: { es: "Data URI, Base64 y CSS, sin metadatos.", en: "Data URI, Base64 and CSS, no metadata." },
    module: "./tools/imgbase64.js"
  },
  gradient: {
    icon: "🌈",
    title: { es: "Generador de degradados", en: "Gradient generator" },
    desc: { es: "Crea degradados CSS y expórtalos.", en: "Create and export CSS gradients." },
    module: "./tools/gradient.js"
  },
  color: {
    icon: "🎯",
    title: { es: "Color y contraste", en: "Color & contrast" },
    desc: { es: "Convierte HEX/RGB/HSL y comprueba WCAG.", en: "Convert HEX/RGB/HSL and check WCAG." },
    module: "./tools/color.js"
  },
  shadow: {
    icon: "🌒",
    title: { es: "Generador de sombras", en: "Shadow generator" },
    desc: { es: "Diseña box-shadow CSS visualmente.", en: "Design CSS box-shadow visually." },
    module: "./tools/shadow.js"
  },
  wordcount: {
    icon: "🔤",
    title: { es: "Contador de palabras", en: "Word counter" },
    desc: { es: "Cuenta palabras, caracteres y tiempo de lectura.", en: "Count words, characters and reading time." },
    module: "./tools/wordcount.js"
  },
  caseconv: {
    icon: "🔠",
    title: { es: "Convertidor de texto", en: "Case converter" },
    desc: { es: "camelCase, snake_case, Título, slug y más.", en: "camelCase, snake_case, Title, slug and more." },
    module: "./tools/caseconv.js"
  },
  textlines: {
    icon: "📑",
    title: { es: "Líneas de texto", en: "Text lines" },
    desc: { es: "Ordena, elimina duplicados y limpia líneas.", en: "Sort, dedupe and clean lines." },
    module: "./tools/textlines.js"
  },
  findreplace: {
    icon: "🔎",
    title: { es: "Buscar y reemplazar", en: "Find & replace" },
    desc: { es: "Reemplaza texto o patrones regex en lote.", en: "Replace text or regex patterns in bulk." },
    module: "./tools/findreplace.js"
  },
  lorem: {
    icon: "📝",
    title: { es: "Lorem ipsum", en: "Lorem ipsum" },
    desc: { es: "Texto de relleno y tablas Markdown.", en: "Placeholder text and Markdown tables." },
    module: "./tools/lorem.js"
  },
  json: {
    icon: "{ }",
    title: { es: "Herramientas JSON", en: "JSON tools" },
    desc: { es: "Formatea, valida y minifica JSON.", en: "Format, validate and minify JSON." },
    module: "./tools/json.js"
  },
  textdiff: {
    icon: "⚖️",
    title: { es: "Comparador de textos", en: "Text compare" },
    desc: { es: "Encuentra diferencias entre dos textos.", en: "Find differences between two texts." },
    module: "./tools/textdiff.js"
  },
  markdown: {
    icon: "#",
    title: { es: "Editor Markdown", en: "Markdown editor" },
    desc: { es: "Escribe Markdown con vista previa en vivo.", en: "Write Markdown with live preview." },
    module: "./tools/markdown.js"
  },
  regex: {
    icon: ".*",
    title: { es: "Probador de Regex", en: "Regex tester" },
    desc: { es: "Prueba expresiones regulares en vivo.", en: "Test regular expressions live." },
    module: "./tools/regex.js"
  },
  hash: {
    icon: "🔒",
    title: { es: "Hash y codificador", en: "Hash & encoder" },
    desc: { es: "SHA-256, Base64 y URL encode.", en: "SHA-256, Base64 and URL encode." },
    module: "./tools/hash.js"
  },
  uuid: {
    icon: "🆔",
    title: { es: "Generador de UUID", en: "UUID generator" },
    desc: { es: "UUID v4 y NanoID en lote.", en: "UUID v4 and NanoID in bulk." },
    module: "./tools/uuid.js"
  },
  timestamp: {
    icon: "🕒",
    title: { es: "Timestamp ↔ fecha", en: "Timestamp ↔ date" },
    desc: { es: "Convierte epoch Unix y fechas legibles.", en: "Convert Unix epoch and readable dates." },
    module: "./tools/timestamp.js"
  },
  jwt: {
    icon: "🎫",
    title: { es: "Decodificador JWT", en: "JWT decoder" },
    desc: { es: "Inspecciona header y payload de un token.", en: "Inspect a token's header and payload." },
    module: "./tools/jwt.js"
  },
  urlparse: {
    icon: "🔗",
    title: { es: "Analizador de URL", en: "URL parser" },
    desc: { es: "Separa y reconstruye URL y parámetros.", en: "Split and rebuild URLs and query params." },
    module: "./tools/urlparse.js"
  },
  password: {
    icon: "🔐",
    title: { es: "Generador de contraseñas", en: "Password generator" },
    desc: { es: "Contraseñas seguras y aleatorias.", en: "Secure random passwords." },
    module: "./tools/password.js"
  },
  qr: {
    icon: "📱",
    title: { es: "Generador de QR", en: "QR generator" },
    desc: { es: "Genera códigos QR en PNG o SVG.", en: "Generate QR codes as PNG or SVG." },
    module: "./tools/qr.js"
  },
  aiprompts: {
    icon: "💡",
    title: { es: "Prompts de IA", en: "AI prompts" },
    desc: { es: "Librería de plantillas de prompts.", en: "Library of prompt templates." },
    module: "./tools/aiprompts.js"
  },
  secrets: {
    icon: "🛡️",
    title: { es: "Limpiador de datos sensibles", en: "Secret cleaner" },
    desc: { es: "Enmascara claves, emails y tokens.", en: "Mask keys, emails and tokens." },
    module: "./tools/secrets.js"
  },
  splitter: {
    icon: "✂️",
    title: { es: "Fragmentador semántico", en: "Semantic splitter" },
    desc: { es: "Divide texto en fragmentos por tamaño.", en: "Split text into chunks by size." },
    module: "./tools/splitter.js"
  },
  tokens: {
    icon: "🔢",
    title: { es: "Contador de tokens", en: "Token counter" },
    desc: { es: "Estimación de tokens para LLMs.", en: "Token estimate for LLMs." },
    module: "./tools/tokens.js"
  }
};

export function toolsOfCategory(category) {
  return category.tools.map((id) => ({ id, category: category.id, ...TOOLS[id] }));
}

export function allTools() {
  return CATEGORIES.flatMap((c) => toolsOfCategory(c));
}

export function toolById(id) {
  if (!TOOLS[id]) return null;
  const cat = CATEGORIES.find((c) => c.tools.includes(id));
  return { id, category: cat ? cat.id : "", ...TOOLS[id] };
}
