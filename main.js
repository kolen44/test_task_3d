import dat from 'dat.gui'
import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000000)

const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
)
camera.position.z = 5

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2)
directionalLight1.position.set(5, 5, 5).normalize()
scene.add(directionalLight1)

const pmremGenerator = new THREE.PMREMGenerator(renderer)
pmremGenerator.compileEquirectangularShader()

renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.0
renderer.outputEncoding = THREE.sRGBEncoding

new RGBELoader().setDataType(THREE.FloatType).load(
	'phone4k.hdr',
	function (texture) {
		const envMap = pmremGenerator.fromEquirectangular(texture).texture
		scene.background = envMap
		scene.environment = envMap
		texture.dispose()
		pmremGenerator.dispose()
	},
	undefined,
	function (err) {
		console.error('Ошибка при загрузке текстуры окружения', err)
	}
)

const geometry1 = new THREE.BoxGeometry()
const material1 = new THREE.MeshStandardMaterial({
	color: 0x00ff00,
	metalness: 0.7,
	roughness: 0.1,
})
const cube = new THREE.Mesh(geometry1, material1)
scene.add(cube)

const geometry2 = new THREE.SphereGeometry()
const material2 = new THREE.MeshStandardMaterial({
	color: 0xff0000,
	metalness: 0.7,
	roughness: 0.1,
})
const sphere = new THREE.Mesh(geometry2, material2)
sphere.position.x = 2
scene.add(sphere)

const loader = new GLTFLoader()
let model
loader.load(
	'door.glb',
	gltf => {
		model = gltf.scene

		scene.add(model)

		const door = model.getObjectByName('Door1001')

		if (door) {
			const scaleFactor = 1
			door.scale.set(scaleFactor, scaleFactor, scaleFactor)

			door.position.x -= 1.5
			door.position.y -= 0.5
			door.rotation.y = (Math.SQRT2 * Math.PI) / 2.85

			const gui = new dat.GUI()
			const doorFolder = gui.addFolder('Изменение размера двери')
			doorFolder.add(door.scale, 'y', 0.1, 2).name('Высота')
			doorFolder.add(door.scale, 'z', 0.1, 2).name('Ширина')

			const doorScale = {
				scale: 0.5,
			}
			const doorScaleController = doorFolder
				.add(doorScale, 'scale', 0.1, 2)
				.name('Все вместе')

			doorScaleController.onChange(value => {
				door.scale.set(value, value, value)
			})
		} else {
			console.error('Данная модель не найдена либо была удалена')
		}
	},
	undefined,
	error => {
		console.error('Ошибка в блоке загрузки 3д двери', error)
	}
)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.25
controls.screenSpacePanning = false
controls.minDistance = 2
controls.maxDistance = 10
controls.enableZoom = true
controls.enablePan = true

function animate() {
	requestAnimationFrame(animate)
	controls.update()
	renderer.render(scene, camera)
}

animate()

window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
})
