import { inject, Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from 'rxjs';
import { ExoplanetResponse, HostNameList } from '../interface/response-api.interface';

@Injectable({
    providedIn: 'root'
})
export class ApiService {

    private baseUrl = 'http://localhost:3000';

    private http = inject( HttpClient );

    getListHostName(){
        return this.http.get<HostNameList[]>(`${this.baseUrl}/list_hostname`);
    }

    searchSystem( hostname: string ){
        return this.http.get<ExoplanetResponse[]>(`${this.baseUrl}/search_system?hostname=${hostname}`);
    }

}