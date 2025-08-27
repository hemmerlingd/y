import { Component } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ChartOptions, ChartType } from 'chart.js';
import { SharedService } from 'src/app/services/shared.service';
import { DataService } from 'src/app/shared/data.service';


@Component({
  selector: 'app-estadisticas',
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.scss']
})
export class EstadisticasComponent {
datos:any;
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


  
constructor(public DS: DataService, private sharedService:SharedService,  private activatedRoute: ActivatedRoute,) {
   
}

async ngOnInit() {
  this.DS.setLoading();
 this.sharedService.leerNoticias().subscribe((ns)=>{
   this.DS.setSaved(ns);
   this.datos = ns;
   this.estadisticaMedios();
  this.DS.setLoaded();
 },
 (error) => {
   console.error("Error al leer noticias:", error);
   // Aquí podrías mostrar un mensaje de error al usuario
 });

  
}

estadisticaMedios(){
let medios: { [clave: string]: number } = {};
let programas: { [clave: string]: number } = {};
let agrupadores: { [clave: string]: number } = {};


this.activatedRoute.paramMap.subscribe((params: ParamMap) => {
      let categoria = params.get('cat');    
      this.datos?.filter((n) => {
        if (n.acf.topic.includes(categoria)) {
          this.noticiasCategoria.push(n);
        }
      });
    });


if(this.noticiasCategoria.length>0){
  this.noticiasCategoria.forEach(e => {
   medios[e.acf.media]= (medios[e.acf.media] || 0) + 1;
   programas[e.acf.program]= (programas[e.acf.program] || 0) + 1;
    
   e.acf.topic.forEach(t => {
     agrupadores[t]= (programas[e.acf.program] || 0) + 1;
   });
  });
}else{
  this.datos.forEach(e => {
   medios[e.acf.media]= (medios[e.acf.media] || 0) + 1;
   programas[e.acf.program]= (programas[e.acf.program] || 0) + 1;
    
   e.acf.topic.forEach(t => {
     agrupadores[t]= (programas[e.acf.program] || 0) + 1;
   });
  });
}

/******MEDIOS*******/
this.conteoMedios = Object.entries(medios).map(([medio, cantidad]) => ({
  medio,
  cantidad
})).sort((a, b) => b.cantidad - a.cantidad);
/******PROGRAMAS********/
this.conteoProgramas = Object.entries(programas).map(([programa, cantidad]) => ({
  programa,
  cantidad
})).sort((a, b) => b.cantidad - a.cantidad);
/******TOPICS********/
this.conteoTopics = Object.entries(agrupadores).map(([topic, cantidad]) => ({
  topic,
  cantidad
})).sort((a, b) => b.cantidad - a.cantidad);



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
        backgroundColor:'#004b81'
      },
    ]
  };
}


}

