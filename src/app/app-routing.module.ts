import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { StartComponent } from './layout/start/start.component';
import { PantallaComponent } from './layout/pantalla/pantalla.component';

const routes: Routes = [
    { path: '', component: StartComponent },
    { path: 'exoplanet', component: PantallaComponent },
    { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
