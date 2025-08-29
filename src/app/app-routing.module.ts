import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PanelComponent } from './components/panel/panel.component';
import { ImportarComponent } from './components/importar/importar.component';
import { EstadisticasComponent } from './components/estadisticas/estadisticas.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'controlmedios',
    pathMatch: 'full'
  },
  {
    path: 'controlmedios',
    children: [
      {
        path: '',
        component: ImportarComponent,
        pathMatch: 'full'
      },
      {
        path: 'panel/:cat',
        component: PanelComponent,
      },
      {
        path: 'estadisticas',
        component: EstadisticasComponent,
      },
      {
        path: 'estadisticas/c/:cat',
        component: EstadisticasComponent,
      },
            {
        path: 'estadisticas/m/:medio',
        component: EstadisticasComponent,
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
