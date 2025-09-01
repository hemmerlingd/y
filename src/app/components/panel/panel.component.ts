import { Component, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { SharedService } from 'src/app/services/shared.service';
import { DataService } from 'src/app/shared/data.service';

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss'],
})
export class PanelComponent {
  categorias: string[];
  categoria: string;
  noticias: Array<{ padre: string; noticia: any[] }> = [];
  noticiasCategoria: any[];
  toast: boolean = false;
  palabrasClaveOriginal: Array<{ palabra: string; padre: string }> = [];
  text: string = '';
  noticiasGuardadas;
  editingIndex: number | null = null;
  
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public DS: DataService,
    private sharedService: SharedService,
    private sanitizer: DomSanitizer
  ) {
    this.DS.setLoading();
    this.activatedRoute.paramMap.subscribe((params: ParamMap) => {
      this.categoria = params.get('cat');
      this.noticias = this.DS.getAgrupadas();
  
    this.filtrarNoticias();
    });
  
    this.categorias = this.DS.getCategorias();
    this.palabrasClaveOriginal = this.DS.getPalabras();
    if (this.noticias.length == 0) {
      this.router.navigate(['/']);
    }
    this.noticiasGuardadas = this.DS.getSaved();
   // console.log(this.noticiasGuardadas);
    this.DS.setLoaded();


  }
  ngOnInit() {
  }

filtrarNoticias() {
    this.noticias.filter((n) => {
      if (n.padre.toLowerCase() == this.categoria.toLowerCase()) {
        this.noticiasCategoria = n.noticia;
      }
    });
}

  quitarCategoria(nota: any, categoria: string) {
    // 1. Find the note in the master news list and remove the category from its topics.
    const masterNewsList = this.DS.getNews();
    const newsItemInMaster = masterNewsList.find(item => item.id_ === nota.id_);

    if (newsItemInMaster) {
        const topicIndex = newsItemInMaster.topic.indexOf(categoria);
        if (topicIndex > -1) {
            newsItemInMaster.topic.splice(topicIndex, 1);
        }
    }
    this.DS.setNews(masterNewsList);

    // 2. Remove the note from the corresponding group in the grouped list.
    this.desagruparNoticias(nota, categoria);
    this.DS.setAgrupadas(this.noticias);

    // 3. Refresh the view.
    this.filtrarNoticias();
  }

desagruparNoticias(nota: any, categoria: string) {
  const group = this.noticias.find((n) => n.padre === categoria);
  if (group) {
    const index = group.noticia.findIndex((e) => e.id_ === nota.id_);
    if (index !== -1) {
      group.noticia.splice(index, 1);
    }
  }
}

  transform(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  resaltarTexto(texto, item) {
    const palabrasClaveOriginal = this.palabrasClaveOriginal;
    // Función para quitar acentos y pasar a minúsculas
    const normalizar = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    let textoResaltado = texto;

    palabrasClaveOriginal.forEach((palabraClave) => {
      const palabraClaveNormalizada = normalizar(palabraClave.palabra);

      // Expresión regular para encontrar la palabra/frase ignorando acentos y mayúsculas
      const regex = new RegExp(
        palabraClave.palabra
          .split('')
          .map((letra: any) => {
            // Si es una letra con tilde, permite ambas variantes
            const base = letra
              .normalize('NFD')
              .toLocaleLowerCase()
              .replace(/[\u0300-\u036f]/g, '');
            // Si la letra es una vocal sin acento, agregar su versión acentuada
            let acento = '';
            const vocales: { [key: string]: string } = {
              a: 'á',
              e: 'é',
              i: 'í',
              o: 'ó',
              u: 'ú',
            };
            if (vocales[base as keyof typeof vocales]) {
              acento = vocales[base as keyof typeof vocales];
            }
            const up = letra
              .normalize('NFD')
              .toUpperCase()
              .replace(/[\u0300-\u036f]/g, '');
            return `[${up}${base}${letra}${acento}]`;
          })
          .join(''),
        'gi'
      );

      textoResaltado = textoResaltado.replace(
        regex,
        (match) => `<span class="resaltado">${match}</span>`
      );
    });

    return textoResaltado;
  }
  copy(text: any) {
    const texto =
      '->*' +
      text.iaResume +
      '* \n' +
      '-> ' +
      text.media +
      ' / ' +
      text.program +
      '\n' +
      '🔗 ->' +
      text.link.trim();

    navigator.clipboard
      .writeText(texto)
      .then(() => {
        this.toast = true;
        this.cerrarToast();
      })
      .catch((err) => {
        console.error('Error al copiar el texto: ', err);
      });
  }
copyAll(items) {
let TODOS='------------\n'+' RESUMEN DE '+ this.categoria.toUpperCase() + '\n------------\n\n';
  items.forEach((t)=>{
    if(t.iaResume){
      //TODO -> ver si existe y modificar en vez de crear.
      console.log(this.noticiasGuardadas);
      this.noticiasGuardadas.forEach((n)=>{
        if(n.acf.id_ === t.id_){
          console.log('ES IGUAL',n,t);          
          //this.sharedService.ActualizarNoticias(t);
        }else{
          return
        }
      })
      // this.sharedService.guardarNoticias(t);
      const cop =
        '->*' +
        t.iaResume +
        '* \n' +
        '-> ' +
        t.media +
        ' / ' +
        t.program +
        '\n' +
        '🔗 ->' +
        t.link.trim()+
        '\n\n ------------\n\n';  
        TODOS+=cop;
    }
  })
  navigator.clipboard
    .writeText(TODOS)
    .then(() => {
      this.toast = true;
      this.cerrarToast();
    })
    .catch((err) => {
      console.error('Error al copiar el texto: ', err);
    });

  }
  cerrarToast() {
    if (this.toast) {
      setTimeout(() => {
        this.toast = false;
      }, 2000);
    }
  }

  guardar(i) {
    this.noticiasCategoria[i].copy =true;
  }
  editar(i) {
    this.noticiasCategoria[i].copy =false;
  }
}
