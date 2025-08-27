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
  loading: boolean = true;

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
 setmedios(data){
    this.mediosYProgramas = data;
  }
 getmedios(){
    return this.mediosYProgramas;
  }
}


