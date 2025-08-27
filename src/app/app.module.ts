import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { NgbDropdownModule, NgbModule, NgbRatingModule } from '@ng-bootstrap/ng-bootstrap';
import { PanelComponent } from './components/panel/panel.component';
import { ImportarComponent } from './components/importar/importar.component';
import { NavComponent } from './components/shared/nav/nav.component';
import { FormsModule } from '@angular/forms';
import { EstadisticasComponent } from './components/estadisticas/estadisticas.component';
import { NgChartsModule } from 'ng2-charts';
import { LoaderComponent } from './components/shared/loader/loader.component';

@NgModule({
  declarations: [
    AppComponent,
    PanelComponent,
    ImportarComponent,
    NavComponent,
    EstadisticasComponent,
    LoaderComponent
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NgbModule,
    FormsModule,
    NgbDropdownModule,
    NgbRatingModule,
    NgChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
