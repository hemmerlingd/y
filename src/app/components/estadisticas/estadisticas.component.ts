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
  conteoTopics:{ topics: string; cantidad: number; }[]=[];
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
  medios=[];
  noticiasCategoria=[];
  noticiasMedio=[];
  estadisticasList;
  categoria:string='TOTALES';
  medio:string='TODOS';
  desde;
  hasta;
  datosAProcesar;
  private subscriptions = new Subscription();

  constructor(public DS: DataService, private sharedService:SharedService,  private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.DS.setLoading();
    this.desde = this.DS.getDesde();
    this.hasta = this.DS.getHasta();
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
        this.medios = this.DS.getMediosXLS();
        
        //reemplazar nombres de medios y programas
        this.datos.forEach(element => {
          const mediaObj = this.medios.find(
        (m) => m.sigla.toLowerCase() === element.acf.media.toLowerCase()
      );
      element.acf.media = mediaObj ? mediaObj.nombre : element.acf.media;
      const programObj = this.medios.find(
        (p) => p.sigla.toLowerCase() === element.acf.program.toLowerCase()
      );
      element.acf.program = programObj ? programObj.nombre : element.acf.program;


        });
        console.log(this.datos);
      },
      error: (error) => {
        console.error("Error al leer noticias:", error);
        this.DS.setLoaded();
      }
    });
    this.subscriptions.add(newsSub);
    
  }
imprimirPDF() {

  window.print();

}
  exportarCSV() {
  const headers = [
      'sendDate',
      'sendTime',
      'media',
      'program',
      'iaResume',
      'link',
      'topics',
    ];
    
    const csv = [
      headers.join(';'),
      ...this.datosAProcesar.map(row => headers.map(header => row.acf[header]).join(';'))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'estadisticas.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

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
    let desde = this.DS.getDesde();
    let hasta = this.DS.getHasta();
    let datosFiltrados = this.datos;

    if(desde && hasta){
      const fromDate = `${desde['year'].toString().slice(-2)}${desde['month'].toString().padStart(2, '0')}${desde['day'].toString().padStart(2, '0')}`;
      const toDate = `${hasta['year'].toString().slice(-2)}${hasta['month'].toString().padStart(2, '0')}${hasta['day'].toString().padStart(2, '0')}`;

       datosFiltrados = this.datos.filter((n) => {
        if (!n.acf.sendDate) {
          return false;
        }
        const fechatmp = n.acf.sendDate.split('/').reverse();

        const fecha = `${fechatmp[0].toString().slice(-2)}${fechatmp[1].toString().padStart(2, '0')}${fechatmp[2].toString().padStart(2, '0')}`;

        if (fecha >= fromDate && fecha <= toDate) {
          return n
        }
      });
    }
     this.datosAProcesar = datosFiltrados;

    
    

    if(tipo == 'categoria'){

      // If a category is present, filter the data
      if (categoria && this.datosAProcesar && categoria !== 'TOTALES') {
        this.noticiasCategoria = this.datosAProcesar.filter((n) => n.acf.topics.includes(categoria));
        this.datosAProcesar = this.noticiasCategoria;
      }
  
      if (!this.datosAProcesar) {
        return; // No data to process
      }
  
      // Perform counts
      this.datosAProcesar.forEach(e => {
        if (e.acf.media)   medios[e.acf.media] = (medios[e.acf.media] || 0) + 1;
        if (e.acf.program) programas[e.acf.program] = (programas[e.acf.program] || 0) + 1;
        if (e.acf.topic) {
          e.acf.topic.forEach(t => {
            agrupadores[t] = (agrupadores[t] || 0) + 1;
          });
        }
      });
    }else{
      if (this.medio && this.datosAProcesar && this.medio  !== 'TODOS') {
        this.noticiasMedio = this.datosAProcesar.filter((n) => n.acf.media.includes(this.medio));
        this.datosAProcesar = this.noticiasMedio;
      }
  
      if (!this.datosAProcesar) {
        return; // No data to process
      }
      this.datosAProcesar.forEach(e => {
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
      this.conteoTopics = Object.entries(agrupadores).map(([topics, cantidad]) => ({ topics, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);
  
      // Update chart data
      this.updateChartData();
  }

  updateChartData() {
    this.barMedios= undefined;
    this.barProgramas= undefined;
    this.barTopics= undefined;

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
    labels: this.conteoTopics.map(item => item.topics),
    datasets: [
      {
        label: 'Cantidad',
        data: this.conteoTopics.map(item => item.cantidad),
        backgroundColor: '#004b81'
      },
    ]
  };
}

Consultar(){
  this.DS.setDesde(this.desde);
  this.DS.setHasta(this.hasta);
  if(this.activatedRoute.snapshot.url[1]?.path == 'm'){
    this.procesarEstadisticas(this.medio,'medio');
  }else{
    this.procesarEstadisticas(this.categoria, 'categoria');
  }
}


}
