import { useEffect, useRef } from "react"
import * as THREE from "three"

function PlantModel({ growth, leaves }) {
  const host = useRef(null)
  useEffect(() => {
    if (!host.current) return undefined
    const element = host.current
    const scene = new THREE.Scene(); scene.background = new THREE.Color("#eef1e5")
    const camera = new THREE.PerspectiveCamera(34, element.clientWidth / 280, 0.1, 100); camera.position.set(0, 1.5, 7)
    const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(element.clientWidth, 280); element.replaceChildren(renderer.domElement)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x65825c, 2.5))
    const key = new THREE.DirectionalLight(0xfff3d6, 2); key.position.set(3, 5, 4); scene.add(key)
    const plant = new THREE.Group(); scene.add(plant)
    const stemMaterial = new THREE.MeshStandardMaterial({ color: "#547743", roughness: 0.78 })
    const leafMaterial = new THREE.MeshStandardMaterial({ color: "#83a75a", roughness: 0.63, side: THREE.DoubleSide })
    const height = 0.6 + growth * 0.026
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.055, height, 8), stemMaterial); stem.position.y = height / 2 - 0.4; plant.add(stem)
    const leafCount = Math.max(2, Math.min(leaves, 18))
    for (let index = 0; index < leafCount; index += 1) {
      const ratio = (index + 1) / (leafCount + 1); const y = ratio * height - 0.3
      const side = index % 2 ? 1 : -1; const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.23 + growth / 200, 10, 8), leafMaterial)
      leaf.scale.set(1.3, 0.13, 0.48); leaf.position.set(side * (0.14 + ratio * 0.55), y, 0); leaf.rotation.z = side * -0.35; leaf.rotation.y = side * 0.45; plant.add(leaf)
    }
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.05, 0.2, 24), new THREE.MeshStandardMaterial({ color: "#a88c66", roughness: 1 })); soil.position.y = -0.45; scene.add(soil)
    let frame; const render = () => { plant.rotation.y += 0.003; renderer.render(scene, camera); frame = requestAnimationFrame(render) }; render()
    const resize = () => { camera.aspect = element.clientWidth / 280; camera.updateProjectionMatrix(); renderer.setSize(element.clientWidth, 280) }
    window.addEventListener("resize", resize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); renderer.dispose(); scene.traverse((object) => { if (object.geometry) object.geometry.dispose(); if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => material.dispose()) }); element.replaceChildren() }
  }, [growth, leaves])
  return <div className="lab-3d-canvas" ref={host} aria-label="Уақытпен өзгеретін жуық 3D өсімдік моделі" />
}

export default PlantModel
