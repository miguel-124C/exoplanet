import { CommonModule, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ExoplanetResponse, HostNameList } from 'src/app/interface/response-api.interface';
import { ApiService } from 'src/app/services/api.service';

@Component({
    selector: 'app-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.css'],
})
export class StartComponent implements OnInit {

    public listHostName = signal<HostNameList[] | null>(null);
    public listExoplanets = signal<ExoplanetResponse[] | null>(null);
    private apiService = inject( ApiService );
    private router = inject( Router );

    constructor() { }

    ngOnInit(): void {
        const list = localStorage.getItem('listHostName');
        if (!list) {
            this.apiService.getListHostName().subscribe((response)=>{
                this.listHostName.set( response );
                localStorage.setItem('listHostName', JSON.stringify(this.listHostName()));
            });   
        }else{
            const hostNames = JSON.parse(list);
            this.listHostName.set( hostNames );
        }
    }
    
    buscarSistema( hostname: string ){
        if(hostname == '0') return;
        this.router.navigateByUrl(`/exoplanet?hostname=${hostname}`);
    }
}
