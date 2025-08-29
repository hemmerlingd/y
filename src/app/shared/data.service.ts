import { Inject, Injectable } from '@angular/core';
import { SharedService } from '../services/shared.service';

@Injectable({
  providedIn: 'root'
})
export class DataService{
  palabrasClaveOriginal: Array<{ palabra: string; padre: string }> = [];
  mediosYProgramas: Array<{ sigla: string; nombre: string }> = [];
  categorias: string[] = [];
  newsItems: [] = [];
  newAgrupadas: Array<{padre: string; noticia:any[]}> =[];
  noticiasGuardadas:[] =[];
  loading: boolean = false;
  estadisticasList:any[]=[];
  mediosList:any[]=[];


   constructor(private sharedService:SharedService) { 
    
  }
  setLoading(){
    this.loading = true;
  }
  setLoaded(){
    this.loading = false;
  }
  setNews(data){
    this.newsItems = data;
  }
    getNews(): any {
    return this.newsItems;
  }
  
  setStats(){
    this.loading=true
    const data = this.getSaved();
    const allTopics = data.flatMap(item => item?.acf?.topic || []);
    this.estadisticasList = [...new Set(allTopics)].sort((a:string, b:string) => a.localeCompare(b));
   this.loading=false
    return this.estadisticasList;
  }

    getStats(): any {
      this.setStats();
    return this.estadisticasList;
  }
    setSaved(data){
    this.noticiasGuardadas = data;
  }
    getSaved(): any {
    return this.noticiasGuardadas;
  }
  
  
  setAgrupadas(data: any) {
    this.newAgrupadas = data;
  }

  getAgrupadas(): any {
    return this.newAgrupadas;
  }
    setCategorias(data: any) {
    this.categorias = data;
  }

  getCategorias(): any {
    return this.categorias;
  }
 setPalabras(data){
    this.palabrasClaveOriginal = data;
  }
 getPalabras(){
    return this.palabrasClaveOriginal;
  }
 setmedios(){
this.loading =true
      let list =[];
    const data = this.getSaved();
    
    const allTopics = data.flatMap(item => item?.acf?.media || []);
    this.mediosList = [...new Set(allTopics)].sort((a:string, b:string) => a.localeCompare(b));
   this.loading =false
    return this.mediosList;
  }
 getmedios(){
  this.setmedios();
    return this.mediosList;
  }
      setMediosXLS(data: any) {
    this.mediosYProgramas = data;
  }

  getMediosXLS(): any {
    return this.mediosYProgramas;
  }
}
