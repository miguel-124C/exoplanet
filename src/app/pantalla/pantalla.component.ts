import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, Input, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';

@Component({
    selector: 'app-pantalla',
    templateUrl: './pantalla.component.html',
    standalone: true,
    styleUrls: ['./pantalla.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PantallaComponent implements OnInit, AfterViewInit {
    
    @ViewChild('canvas') private canvasRef!: ElementRef;

    @Input() public rotationSpeedX: number = 0.05;
    @Input() public rotationSpeedY: number = 0.01;
    @Input() public size: number = 200;
    @Input() public texture: string = '/assets/texture.jpg';
    @Input() public cameraZ: number = 400;
    @Input() public fieldOfView: number = 1;
    @Input('nearClipping') public nearClippingPlane: number = 1;
    @Input('farClipping') public farClippingPlane: number = 1000;

    private camera!: THREE.PerspectiveCamera;
    private get canvas(): HTMLCanvasElement{
        return this.canvasRef.nativeElement;
    }
    private loader = new THREE.TextureLoader();
    private geometry = new THREE.BoxGeometry(1,1,1);
    private material = new THREE.MeshBasicMaterial({color: 0xfff000});
    private cube = new THREE.Mesh( this.geometry, this.material );

    private renderer!: THREE.WebGLRenderer;

    private scene!: THREE.Scene;

    constructor() { }
    ngAfterViewInit(): void {
        this.createScene();
        this.startRenderingLoop();
    }

    @HostListener('wheel', ['$event'])
    onWheel(event: WheelEvent) {
        console.log(event.deltaY);
        
        if (event.deltaY < 0) {
            this.zoomIn(); // Hacer zoom al acercarse
        } else {
            this.zoomOut(); // Alejarse
        }
    }


    ngOnInit(): void {
    }

    private startRenderingLoop(){
        // Renderer
        this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
        this.renderer.setPixelRatio( devicePixelRatio );
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

        let component = this;
        (function render(){
          requestAnimationFrame( render );
          component.animateCube();
          component.renderer.render( component.scene, component.camera );
        })();
    }

    private createScene(){
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.add( this.cube );
        // camera
        let aspectRatio = this.getAspectRadio();
        this.camera = new THREE.PerspectiveCamera(
            this.fieldOfView,
            aspectRatio,
            this.nearClippingPlane,
            this.farClippingPlane,
        );
        this.camera.position.z = this.cameraZ;
    }

    // Para hacer zoom
    private zoomIn() {
        this.fieldOfView = this.fieldOfView - 1// Reduce el FOV (más zoom)
        this.updateCamera();
    }

    // Para alejar
    private zoomOut() {
        this.fieldOfView = this.fieldOfView + 1// Aumenta el FOV (menos zoom)
        this.updateCamera();
    }

    private updateCamera() {
        this.camera.fov = this.fieldOfView;
        this.camera.updateProjectionMatrix(); // Actualiza la matriz de proyección de la cámara
    }


    private animateCube(){
        this.cube.rotation.x += this.rotationSpeedX;
        this.cube.rotation.y += this.rotationSpeedY;
    }

    private getAspectRadio(){
        return this.canvas.clientWidth / this.canvas.clientHeight;
    }

}
