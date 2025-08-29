import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ChartOptions, ChartType } from 'chart.js';
import { Subscription } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';
import { DataService } from 'src/app/shared/data.service';

@Component({
  selector: 'app-estadisticas',
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.scss']
})
export class EstadisticasComponent implements OnInit, OnDestroy {
  datos: any;
  conteoMedios:{ medio: string; cantidad: number; }[]=[];
  conteoProgramas:{ programa: string; cantidad: number; }[]=[];
  conteoTopics:{ topic: string; cantidad: number; }[]=[];
  barChartType: ChartType = 'bar';
  pieChartType: ChartType = 'pie';
  ChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false}
    }
  };
  barMedios;
  barProgramas;
  barTopics;
  noticiasCategoria=[];
  noticiasMedio=[];
  estadisticasList;
  categoria:string='TOTALES';
  medio:string='TODOS';

  private subscriptions = new Subscription();

  constructor(public DS: DataService, private sharedService:SharedService,  private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.DS.setLoading();
    const newsSub = this.sharedService.leerNoticias().subscribe({
      next: (ns) => {
        this.DS.setSaved(ns);
        this.datos = ns;
        // Subscribe to route parameter changes here, after data is loaded
        const paramsSub = this.activatedRoute.paramMap.subscribe((params: ParamMap) => {
          this.categoria = params.get('cat') || 'TOTALES';
          this.medio = params.get('medio') || 'TODOS';
          if(this.activatedRoute.snapshot.url[1]?.path == 'm'){
            this.procesarEstadisticas(this.medio,'medio'); 
          }else{
            this.procesarEstadisticas(this.categoria, 'categoria');
          }
          
        });
        this.subscriptions.add(paramsSub); // Add to subscriptions for cleanup
        this.DS.setLoaded();
      },
      error: (error) => {
        console.error("Error al leer noticias:", error);
        this.DS.setLoaded();
      }
    });
    this.subscriptions.add(newsSub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe(); // Clean up subscriptions to prevent memory leaks
  }

  procesarEstadisticas(categoria: string | null, tipo: string) {
    // Reset arrays to ensure clean state on each navigation
    this.noticiasCategoria = [];
    let medios: { [clave: string]: number } = {};
    let programas: { [clave: string]: number } = {};
    let agrupadores: { [clave: string]: number } = {};

    let datosAProcesar = this.datos;

    if(tipo == 'categoria'){

      // If a category is present, filter the data
      if (categoria && this.datos && categoria !== 'TOTALES') {
        this.noticiasCategoria = this.datos.filter((n) => n.acf.topic.includes(categoria));
        datosAProcesar = this.noticiasCategoria;
      }
  
      if (!datosAProcesar) {
        return; // No data to process
      }
  
      // Perform counts
      datosAProcesar.forEach(e => {
        if (e.acf.media)   medios[e.acf.media] = (medios[e.acf.media] || 0) + 1;
        if (e.acf.program) programas[e.acf.program] = (programas[e.acf.program] || 0) + 1;
        if (e.acf.topic) {
          e.acf.topic.forEach(t => {
            agrupadores[t] = (agrupadores[t] || 0) + 1;
          });
        }
      });
    }else{
      if (this.medio && this.datos && this.medio  !== 'TODOS') {
        this.noticiasMedio = this.datos.filter((n) => n.acf.media.includes(this.medio));
        datosAProcesar = this.noticiasMedio;
      }
  
      if (!datosAProcesar) {
        return; // No data to process
      }
      datosAProcesar.forEach(e => {
        if (e.acf.media)   medios[e.acf.media] = (medios[e.acf.media] || 0) + 1;
        if (e.acf.program) programas[e.acf.program] = (programas[e.acf.program] || 0) + 1;
        if (e.acf.topic) {
          e.acf.topic.forEach(t => {
            agrupadores[t] = (agrupadores[t] || 0) + 1;
          });
        }
      });
  

    }
          /******MEDIOS*******/
      this.conteoMedios = Object.entries(medios).map(([medio, cantidad]) => ({ medio, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);
  
      /******PROGRAMAS********/
      this.conteoProgramas = Object.entries(programas).map(([programa, cantidad]) => ({ programa, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);
  
      /******TOPICS********/
      this.conteoTopics = Object.entries(agrupadores).map(([topic, cantidad]) => ({ topic, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);
  
      // Update chart data
      this.updateChartData();
  }

  updateChartData() {
  this.barMedios = {
    labels: this.conteoMedios.map(item => item.medio),
    datasets: [
      {
        label: 'Cantidad',
        data: this.conteoMedios.map(item => item.cantidad),
        hoverOffset: 150
      },
    ]
  };

  this.barProgramas = {
    labels: this.conteoProgramas.map(item => item.programa),
    datasets: [
      {
        label: 'Cantidad',
        data: this.conteoProgramas.map(item => item.cantidad),
        hoverOffset: 150,
      },
    ]
  };

   this.barTopics = {
    labels: this.conteoTopics.map(item => item.topic),
    datasets: [
      {
        label: 'Cantidad',
        data: this.conteoTopics.map(item => item.cantidad),
        backgroundColor: '#004b81'
      },
    ]
  };
}
}
