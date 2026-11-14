# VELNORA-Games

Repositorio oficial de desarrollo de **VELNORA Studios**.

# MINING EMPIRE — Edición de lanzamiento 1.0.0

MINING EMPIRE es un juego de minería, exploración y gestión empresarial para navegador. Su mundo utiliza gráficos 2D dibujados en Canvas con perspectiva isométrica simulada. No necesita instalación, frameworks ni servicios externos para jugar.

## Sistemas incluidos

- Segunda pasada visual: vetas minerales con siluetas más naturales, minero con equipo y pico mejor definidos, iluminación ambiental y tonos de atmósfera distintos según la región.

- Escenario ilustrado isométrico de la Mina abandonada, con plataformas de madera, túneles, raíles, vagoneta, elevador, vetas y cristales; depósitos interactivos de carbón, cobre, hierro, oro y cristal.
- Movimiento con WASD o flechas, controles reasignables y botones táctiles en pantallas pequeñas.
- Minería manual, resistencia de los bloques, energía y experiencia del operario.
- Progresión de niveles, mejoras de pico y ampliaciones de almacén.
- Economía con precios distintos por mineral y venta del inventario.
- Seis regiones desbloqueables: Mina abandonada, Galerías profundas, Caverna cristalina, Cuenca volcánica, Abismo congelado y Núcleo antiguo.
- Campaña principal de ocho objetivos con recompensas y una conclusión narrativa al descubrir el núcleo.
- Automatización con taladros, generadores y trabajadores contratados.
- Logros, estadísticas de por vida y guardado local automático.
- Interfaz adaptable a escritorio y móvil.

## Jugar

1. Abre `index.html` en un navegador moderno.
2. También puedes habilitar GitHub Pages desde **Settings → Pages**.
3. Selecciona **Deploy from a branch**, rama `main`, carpeta `/(root)` y guarda.

No hay un proceso de compilación. Los archivos del juego son HTML, CSS y JavaScript estándar.

## Controles

| Acción | Teclado |
|---|---|
| Moverse | WASD o flechas |
| Excavar | Clic o toque sobre un bloque cercano |
| Interactuar / expediciones | E |
| Abrir inventario | I |
| Cerrar panel | Escape |
| Movimiento móvil | Controles en pantalla |

## Archivos

- `index.html`: interfaz, HUD, diálogos y controles.
- `style.css`: diseño visual adaptable.
- `game.js`: mundo, economía, campaña, regiones, automatización y guardado.
- `assets/mine-abandoned.svg`: escenario ilustrado original de la primera región.

## Guardado

El progreso se guarda en el almacenamiento local del navegador. Para conservarlo, usa el mismo navegador y no borres los datos del sitio. El botón de guardado permite guardar manualmente. La opción de reiniciar partida elimina el progreso local de MINING EMPIRE.

## Nota de desarrollo

Esta versión consolida el ciclo principal de juego y la campaña inicial. La publicación de GitHub Pages debe activarse desde la configuración del repositorio; subir los archivos no activa Pages automáticamente.

**VELNORA Studios** — mundos que merecen ser explorados.
