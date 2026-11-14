/*
 * Build enxuto do Phaser 4 (M5, ADR 0009).
 *
 * O Vite resolve `import * as Phaser from 'phaser'` para este arquivo (alias em vite.config.ts);
 * os tipos continuam vindo do pacote `phaser`. Aqui entra só o que o quarto usa, puxado do
 * código-fonte do Phaser (CommonJS em node_modules/phaser/src), e as flags de build
 * (`typeof WEBGL_RENDERER` etc.) são trocadas pelo plugin `phaserFlags` do vite.config.ts.
 *
 * Fora do build: física (arcade/matter), Actions, Curves, Utils, Filters, Gamepad, partículas,
 * texto, bitmap text, shaders, mesh/rope, câmera 3D, Facebook Instant Games e o renderer Canvas.
 *
 * Ao usar uma API nova do Phaser (outro game object em `this.add.*`, outro tipo em `this.load.*`,
 * outro namespace), inclua o módulo aqui; senão ela fica `undefined` em runtime mesmo com o
 * TypeScript aceitando. O teste tests/m5-perf-phaser.test.ts confere a lista.
 */

import '../../node_modules/phaser/src/polyfills/requestVideoFrame.js'

import CONST from '../../node_modules/phaser/src/const.js'

import AnimationsNS from '../../node_modules/phaser/src/animations/index.js'
import BlendModesNS from '../../node_modules/phaser/src/renderer/BlendModes.js'
import CacheNS from '../../node_modules/phaser/src/cache/index.js'
import Scene2D from '../../node_modules/phaser/src/cameras/2d/index.js'
import CoreNS from '../../node_modules/phaser/src/core/index.js'
import ClassFn from '../../node_modules/phaser/src/utils/Class.js'
import DataNS from '../../node_modules/phaser/src/data/index.js'
import EventsNS from '../../node_modules/phaser/src/events/index.js'
import GameClass from '../../node_modules/phaser/src/core/Game.js'
import PluginsNS from '../../node_modules/phaser/src/plugins/index.js'
import RendererNS from '../../node_modules/phaser/src/renderer/index.js'
import ScaleNS from '../../node_modules/phaser/src/scale/index.js'
import ScaleModesNS from '../../node_modules/phaser/src/renderer/ScaleModes.js'
import SceneClass from '../../node_modules/phaser/src/scene/Scene.js'
import ScenesNS from '../../node_modules/phaser/src/scene/index.js'
import SoundNS from '../../node_modules/phaser/src/sound/index.js'
import StructsNS from '../../node_modules/phaser/src/structs/index.js'
import TexturesNS from '../../node_modules/phaser/src/textures/index.js'
import TimeNS from '../../node_modules/phaser/src/time/index.js'
import TintModesNS from '../../node_modules/phaser/src/renderer/TintModes.js'
import TweensNS from '../../node_modules/phaser/src/tweens/index.js'

// Game objects: o require de cada Factory/Creator registra `this.add.*` / `this.make.*`.
import DisplayList from '../../node_modules/phaser/src/gameobjects/DisplayList.js'
import GameObjectCreator from '../../node_modules/phaser/src/gameobjects/GameObjectCreator.js'
import GameObjectFactory from '../../node_modules/phaser/src/gameobjects/GameObjectFactory.js'
import UpdateList from '../../node_modules/phaser/src/gameobjects/UpdateList.js'
import Components from '../../node_modules/phaser/src/gameobjects/components/index.js'
import GameObject from '../../node_modules/phaser/src/gameobjects/GameObject.js'
import Graphics from '../../node_modules/phaser/src/gameobjects/graphics/Graphics.js'
import Image from '../../node_modules/phaser/src/gameobjects/image/Image.js'
import Sprite from '../../node_modules/phaser/src/gameobjects/sprite/Sprite.js'
import Zone from '../../node_modules/phaser/src/gameobjects/zone/Zone.js'
import '../../node_modules/phaser/src/gameobjects/graphics/GraphicsFactory.js'
import '../../node_modules/phaser/src/gameobjects/graphics/GraphicsCreator.js'
import '../../node_modules/phaser/src/gameobjects/image/ImageFactory.js'
import '../../node_modules/phaser/src/gameobjects/image/ImageCreator.js'
import '../../node_modules/phaser/src/gameobjects/sprite/SpriteFactory.js'
import '../../node_modules/phaser/src/gameobjects/sprite/SpriteCreator.js'
import '../../node_modules/phaser/src/gameobjects/zone/ZoneFactory.js'
import '../../node_modules/phaser/src/gameobjects/zone/ZoneCreator.js'
// Plugin de cena padrão (DefaultPlugins.DefaultScene); fica registrado mesmo sem luzes no quarto.
import '../../node_modules/phaser/src/gameobjects/lights/LightsPlugin.js'

// Geom: só o retângulo (hit area dos interagíveis).
import Rectangle from '../../node_modules/phaser/src/geom/rectangle/Rectangle.js'

// Input sem Gamepad. O require de Keyboard/Mouse/Touch registra os plugins de entrada.
import INPUT_CONST from '../../node_modules/phaser/src/input/const.js'
import InputEvents from '../../node_modules/phaser/src/input/events/index.js'
import InputManager from '../../node_modules/phaser/src/input/InputManager.js'
import InputPlugin from '../../node_modules/phaser/src/input/InputPlugin.js'
import InputPluginCache from '../../node_modules/phaser/src/input/InputPluginCache.js'
import Keyboard from '../../node_modules/phaser/src/input/keyboard/index.js'
import Mouse from '../../node_modules/phaser/src/input/mouse/index.js'
import Pointer from '../../node_modules/phaser/src/input/Pointer.js'
import Touch from '../../node_modules/phaser/src/input/touch/index.js'

// Loader: só os tipos usados (o require de cada FileType registra `this.load.*`).
import LoaderEvents from '../../node_modules/phaser/src/loader/events/index.js'
import LOADER_CONST from '../../node_modules/phaser/src/loader/const.js'
import LoaderPlugin from '../../node_modules/phaser/src/loader/LoaderPlugin.js'
import File from '../../node_modules/phaser/src/loader/File.js'
import MultiFile from '../../node_modules/phaser/src/loader/MultiFile.js'
import AsepriteFile from '../../node_modules/phaser/src/loader/filetypes/AsepriteFile.js'
import AudioFile from '../../node_modules/phaser/src/loader/filetypes/AudioFile.js'
import ImageFile from '../../node_modules/phaser/src/loader/filetypes/ImageFile.js'
import JSONFile from '../../node_modules/phaser/src/loader/filetypes/JSONFile.js'
import TilemapJSONFile from '../../node_modules/phaser/src/loader/filetypes/TilemapJSONFile.js'

// Tilemaps: só leitura do mapa do Tiled (`this.make.tilemap`), sem camadas de tiles.
import TILEMAP_CONST from '../../node_modules/phaser/src/tilemaps/const/index.js'
import Tilemap from '../../node_modules/phaser/src/tilemaps/Tilemap.js'
import ObjectLayer from '../../node_modules/phaser/src/tilemaps/mapdata/ObjectLayer.js'
import Formats from '../../node_modules/phaser/src/tilemaps/Formats.js'
import '../../node_modules/phaser/src/tilemaps/TilemapCreator.js'

export const Animations = AnimationsNS
export const BlendModes = BlendModesNS
export const Cache = CacheNS
export const Cameras = { Scene2D }
export const Core = CoreNS
export const Class = ClassFn
export const Data = DataNS
export const Events = EventsNS
export const Game = GameClass
export const GameObjects = {
  DisplayList,
  GameObjectCreator,
  GameObjectFactory,
  UpdateList,
  Components,
  GameObject,
  Graphics,
  Image,
  Sprite,
  Zone,
}
export const Geom = { Rectangle }
export const Input = {
  ...INPUT_CONST,
  Events: InputEvents,
  InputManager,
  InputPlugin,
  InputPluginCache,
  Keyboard,
  Mouse,
  Pointer,
  Touch,
}
export const Loader = {
  ...LOADER_CONST,
  Events: LoaderEvents,
  File,
  LoaderPlugin,
  MultiFile,
  FileTypes: { AsepriteFile, AudioFile, ImageFile, JSONFile, TilemapJSONFile },
}
export const Plugins = PluginsNS
export const Renderer = RendererNS
export const Scale = ScaleNS
export const ScaleModes = ScaleModesNS
export const Scene = SceneClass
export const Scenes = ScenesNS
export const Sound = SoundNS
export const Structs = StructsNS
export const Textures = TexturesNS
export const Time = TimeNS
export const TintModes = TintModesNS
export const Tweens = TweensNS
export const Tilemaps = { ...TILEMAP_CONST.ORIENTATION, Formats, ObjectLayer, Tilemap }

export const VERSION = CONST.VERSION
export const AUTO = CONST.AUTO
export const CANVAS = CONST.CANVAS
export const WEBGL = CONST.WEBGL
export const HEADLESS = CONST.HEADLESS
export const FOREVER = CONST.FOREVER
export const NONE = CONST.NONE
export const UP = CONST.UP
export const DOWN = CONST.DOWN
export const LEFT = CONST.LEFT
export const RIGHT = CONST.RIGHT
