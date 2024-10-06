import { NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExoplanetResponse } from 'src/app/interface/response-api.interface';
import { ApiService } from 'src/app/services/api.service';
import { getCartesianCoordinates } from 'src/app/utils/calcular-coordenates';
import * as THREE from 'three';

@Component({
    selector: 'app-pantalla',
    templateUrl: './pantalla.component.html',
    standalone: true,
    styleUrls: ['./pantalla.component.css'],
    imports: [ NgIf ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PantallaComponent implements OnInit, AfterViewInit {

    @ViewChild('canvas') private canvasRef!: ElementRef;

    private apiService = inject( ApiService );
    private activatedRoute = inject( ActivatedRoute );
    public exoplanets = signal<ExoplanetResponse[] | null>( null );

    public systemName: string = '';

    public rotationSpeedX: number = 0.01;
    public rotationSpeedY: number = 0.01;
    public textureFondo = 'assets/estrellas.png'
    public cameraZ: number = 400;
    public fieldOfView: number = 20;
    public nearClippingPlane: number = 1;
    public farClippingPlane: number = 1000;
    
    private isDragging = false;
    public loader = false;
    private previousMousePosition = { x: 0, y: 0 };
    private camera!: THREE.PerspectiveCamera;
    private get canvas(): HTMLCanvasElement{
        return this.canvasRef.nativeElement;
    }

    private renderer!: THREE.WebGLRenderer;
    private scene!: THREE.Scene;

    ngAfterViewInit(): void {
        this.activatedRoute.queryParams.subscribe(({hostname})=>{
            this.loader = true;
            this.apiService.searchSystem( hostname ).subscribe((response)=>{
                if (response.length > 0) {
                    this.loader = false;
                    console.log(response);
                    
                    this.exoplanets.set( response );
                    this.systemName = hostname;
                    this.createScene();
                    this.startRenderingLoop();
                }
            });
        });
    }

    getSpherGeometry( radius: number, widthSegments: number, heightSegments: number, materialParam: THREE.MeshBasicMaterialParameters, pl_name: string,
        x: number, y: number, z: number
     ){
        const geometry = new THREE.SphereGeometry( radius, widthSegments, heightSegments );
        const material = new THREE.MeshBasicMaterial(materialParam);

        const exoplanetName = this.createTextSprite(pl_name);
        exoplanetName.position.set( x , y + 2 , z);
        this.scene.add(exoplanetName);

        return new THREE.Mesh( geometry, material );
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (this.isDragging) {
            const deltaX = event.clientX - this.previousMousePosition.x;
            const deltaY = event.clientY - this.previousMousePosition.y;
    
            // Actualiza la rotación de la cámara
            this.scene.rotation.y += deltaX * this.rotationSpeedX;
            this.scene.rotation.x += deltaY * this.rotationSpeedY;
    
            // Actualiza la posición del mouse
            this.previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    }
    
    @HostListener('document:mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        if (event.button === 0) {  // Botón izquierdo del mouse
            this.isDragging = true;
            this.previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    }
    
    @HostListener('document:mouseup', ['$event'])
    onMouseUp(event: MouseEvent) {
        if (event.button === 0) {
            this.isDragging = false;
        }
    }

    @HostListener('wheel', ['$event'])
    onWheel(event: WheelEvent) {
        event.preventDefault();
    
        // Normaliza las coordenadas del mouse entre -1 y 1
        const mouse = {
            x: (event.clientX / window.innerWidth) * 2 - 1,
            y: -(event.clientY / window.innerHeight) * 2 + 1
        };
    
        // Usa un Raycaster para proyectar un rayo en la escena desde la cámara
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), this.camera);
    
        // Encuentra el punto donde el rayo intersecta con el plano de la escena (puedes usar un objeto en tu escena)
        const intersects = raycaster.intersectObjects(this.scene.children);
    
        if (intersects.length > 0) {
            const targetPoint = intersects[0].point; // Punto en la escena donde el mouse está apuntando
    
            // Calcular la dirección del zoom
            const direction = new THREE.Vector3().subVectors(targetPoint, this.camera.position).normalize();
            
            // Hacer zoom hacia o desde el punto del mouse
            if (event.deltaY < 0) {
                this.camera.position.addScaledVector(direction, 10);  // Zoom in (acercar)
            } else {
                this.camera.position.addScaledVector(direction, -10);   // Zoom out (alejar)
            }
    
            this.updateCamera();
        }
    }
    
    ngOnInit(): void {
        this.isDragging = false;
    }

    private startRenderingLoop(){
        // Renderer
        this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
        this.renderer.setPixelRatio( devicePixelRatio );
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

        let component = this;
        (function render(){
          requestAnimationFrame( render );
          component.renderer.render( component.scene, component.camera );
        })();
    }

    private createScene(){
        // Scene
        this.scene = new THREE.Scene();
        // Cargar la textura de la imagen de fondo
        const loader = new THREE.TextureLoader();
        loader.load(this.textureFondo, (texture) => {
        this.scene.background = texture; // Establecer la imagen como fondo de la escena
        });

        this.addPlanet();

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

    addPlanet(){
        this.exoplanets()!.forEach(({ dec, ra, pl_orbsmax, pl_rade, pl_name, hostname }, index)=>{
            const baseSegments = 16; // Un número base para los segmentos

            // Derivar los segmentos en función del radio del planeta
            const widthSegments = Math.max(8, Math.floor(baseSegments * (pl_rade / 6371)));
            const heightSegments = widthSegments;
            const au = pl_orbsmax ?? -(index * Math.random() * 5);
            const coord = getCartesianCoordinates({
                ra, dec, orbitSemiMajorAxis: au
            });
            
            const radio = pl_rade ?? 1;

            const planet = this.getSpherGeometry(
                radio, widthSegments, heightSegments, {color: Math.random() * 0xffffff}, pl_name,
                coord.x, coord.y, coord.z
            );
            
            // Añadir el sprite a la escena
            const edgesGeometry = new THREE.EdgesGeometry(planet.geometry);
            const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
            planet.add(new THREE.LineSegments(edgesGeometry, edgesMaterial));
            planet.position.set(coord.x, coord.y, coord.z);
            this.scene.add( planet );

            this.addStellar( 2, hostname );
        });
    }

    addStellar( radio: number, hostname: string ){
        const stellar = this.getSpherGeometry( radio, 20, 20, {color: 0xfff000}, hostname, 0, 0, 0 );
        const edgesGeometry = new THREE.EdgesGeometry(stellar.geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        stellar.add(new THREE.LineSegments(edgesGeometry, edgesMaterial));
        stellar.position.set(0, 0, 0);
        this.scene.add( stellar );
    }

    // Crear una textura de un canvas con el nombre del exoplaneta
    createTextSprite(text: string) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const fontSize = 64;
        
        context!.font = `${fontSize}px Arial`;
        context!.fillStyle = 'white';
        context!.fillText(text, 0, fontSize, 200);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture, sizeAttenuation: true });
        const sprite = new THREE.Sprite(spriteMaterial);

        // Ajustar el tamaño del sprite
        sprite.scale.set(10, 5, 1); // Cambia estos valores según lo necesites
        
        return sprite;
    }

    private updateCamera() {
        this.camera.fov = this.fieldOfView;
        this.camera.updateProjectionMatrix();
    }

    private getAspectRadio(){
        return this.canvas.clientWidth / this.canvas.clientHeight;
    }

}