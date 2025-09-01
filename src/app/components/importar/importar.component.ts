import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { SharedService } from '../../services/shared.service';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DataService } from 'src/app/shared/data.service';

// Interfaz para definir la estructura de cada noticia
export interface NewsItem {
  id_: string;
  sendDate: string;
  sendTime: string;
  media: string;
  program: string;
  text: string;
  resume?: string;
  iaResume?: string;
  link: string;
  startTime: string;
  endTime: string;
  topic: string[];
  destacada?: boolean;
  copy: boolean;
}

@Component({
  selector: 'app-importar',
  templateUrl: './importar.component.html',
  styleUrls: ['./importar.component.scss'],
})
export class ImportarComponent {
  title = 'ctrlMedios';
  sharedService = inject(SharedService);
  dataService = inject(DataService);
  newsItems: NewsItem[] = [];
  errorMessage: string = '';
  toast: boolean = false;
  palabrasClaveOriginal: Array<{ palabra: string; padre: string }> = [];
  mediosYProgramas: Array<{ sigla: string; nombre: string }> = [];
  categorias: string[] = [];
  IAtext: any;
  newAgrupadas: Array<{ padre: string; noticia: NewsItem[] }> = [];
  newsItemsFiltradas: NewsItem[] = [];
  arrayPalabras: [] = [];
  editingIndex: number | null = null;

  constructor(private sanitizer: DomSanitizer) {}
  async ngOnInit() {
    this.sharedService.leerNoticias().subscribe((ns) => {
      this.dataService.setSaved(ns);
    });

    this.newsItems = this.dataService.getNews();

    (await this.sharedService.getPalabrasClave()).subscribe((data: any) => {
      const jsonData = JSON.parse(data.substring(47).slice(0, -2));

      this.mediosYProgramas = jsonData.table.rows
        .filter((mp: any) => mp.c[3] && mp.c[3].v && mp.c[4] && mp.c[4].v)
        .map((mp: any) => {
          return {
            sigla: mp.c[3].v,
            nombre: mp.c[4].v,
          };
        });
      this.mediosYProgramas.splice(0, 1);
      this.dataService.setMediosXLS(this.mediosYProgramas);

      this.palabrasClaveOriginal = jsonData.table.rows.map((row: any) => {
        return {
          palabra: row.c[0].v,
          padre: row.c[1].v,
        };
      });
      this.palabrasClaveOriginal.splice(0, 1);
      this.dataService.setPalabras(this.palabrasClaveOriginal);

      this.categorias = Array.from(
        new Set(
          this.palabrasClaveOriginal.flatMap((item) =>
            item.padre
              .split(';')
              .map((p: string) => p.trim())
              .filter((p: string) => p)
          )
        )
      ).sort();
      this.dataService.setCategorias(this.categorias);
    });

    try {
    } catch (error) {
      console.error('Error al leer el archivo:', error);
    }
  }

  // Maneja la selección de archivos
  onFileSelected(event: Event): void {
    this.dataService.setLoading();
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      this.errorMessage = 'No se seleccionó ningún archivo.';
      return;
    }
    this.newAgrupadas = [];

    const file = input.files[0];
    if (file.type !== 'text/plain') {
      this.errorMessage = 'Por favor, selecciona un archivo .txt';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = reader.result as string;
      this.parseContent(content);
    };
    reader.onerror = () => {
      this.errorMessage = 'Error al leer el archivo.';
    };
    reader.readAsText(file);
    this.dataService.setLoaded();
  }

  // Parsea el contenido del archivo de texto
  private parseContent(content: string): void {
    this.dataService.setLoading();
    this.newsItems = [];
    // Regex para dividir el archivo en mensajes individuales basados en la fecha y hora
    const messages = content.split(
      /\n(?=\[\d{1,2}\/\d{1,2}\/\d{2,4}, \d{1,2}:\d{2}:\d{2}.*?\])/
    );

    this.categorias.forEach((p) => {
      this.newAgrupadas.push({ padre: p, noticia: [] });
    });
    for (const message of messages) {
      if (!message.trim()) continue;

      // 1. Extraer Fecha y Hora
      const dateTimeRegex =
        /\[(\d{1,2}\/\d{1,2}\/\d{2,4}), (\d{1,2}:\d{2}:\d{2}.*?)\]/;
      const dateTimeMatch = message.match(dateTimeRegex);
      if (!dateTimeMatch) continue;

      const sendDate = dateTimeMatch[1];
      const sendTime = dateTimeMatch[2];

      const splitDate = sendDate.split('/');
      const splitTime = sendTime.split(':');
      const id_ =
        splitDate[0] +
        splitDate[1] +
        splitDate[2] +
        splitTime[0] +
        splitTime[1] +
        splitTime[2];

      let messageBody = message
        .substring(dateTimeMatch[0].length)
        .split(':')
        .slice(1)
        .join(':')
        .trim();

      // Omitir mensajes de bienvenida o mensajes automáticos
      if (
        messageBody.includes(
          'Los mensajes y las llamadas están cifrados de extremo a extremo'
        ) ||
        messageBody.includes('creó este grupo') ||
        messageBody.includes('Hugo Tejeda te añadió.')
      ) {
        continue;
      }

      // Omitir mensajes de solo imagen sin texto
      if (
        messageBody.includes('imagen omitida') &&
        messageBody.replace('imagen omitida', '').trim() === ''
      ) {
        continue;
      }
      messageBody.replace('imagen omitida', '').trim();
      messageBody = messageBody.replace('‼️', '').trim();

      // 6. Extraer Link
      const linkRegex = /(https?:\/\/[^\s]+)/;
      const linkMatch = messageBody.match(linkRegex);
      const link = linkMatch ? linkMatch[0] : '';

      // 2. Extraer Medio y Programa
      let { media, program } = this.extractMediaAndProgram(messageBody);
      // 5. Extraer Inicio y Fin de emisión
      const timeRangeRegex = /(\d{2}[.:]\d{2})-(\d{2}[.:]\d{2})/;
      const timeRangeMatch = messageBody.match(timeRangeRegex);
      const startTime = timeRangeMatch ? timeRangeMatch[1] : '';
      const endTime = timeRangeMatch ? timeRangeMatch[2] : '';
      const mediaProgramRegex =
        /^([A-ZÁÉÍÓÚÑÜ]{2,})\.\s*([A-ZÁÉÍÓÚÑÜ]{2,})\.\s/;
      // 3. Extraer Texto y manejar transcripciones
      // Quitar medio y programa del texto
      let text;
      let textLimpio = messageBody
        .replace(linkRegex, '')
        .replace(timeRangeRegex, '')
        .replace(mediaProgramRegex, '')
        .trim();

      const jsonString = JSON.stringify(textLimpio);
      // this.sharedService.generarResumen(jsonString).subscribe((ia)=>{
      // console.log(ia);

      // })

      let resume: string | undefined = undefined;
      const transcriptionRegex = /IA\.TXT:\s*/;
      if (transcriptionRegex.test(textLimpio)) {
        const parts = textLimpio.split(transcriptionRegex);
        const mainText = parts[0].trim();
        const transcriptionText = parts[1].trim();
        text = mainText;
        resume = transcriptionText;
      } else {
        text = textLimpio;
        resume = '';
      }
      let destacada = false;

      const topic = this.determineTopic(text);
      if (topic.includes('Destacadas')) {
        destacada = true;
      } else {
        destacada = false;
      }
      const nota: NewsItem = {
        id_,
        sendDate,
        sendTime,
        media,
        program,
        text,
        resume,
        iaResume: null,
        link,
        startTime,
        endTime,
        topic,
        destacada,
        copy: false,
      };
      this.newsItems.push(nota);

      this.agruparNoticias(nota);
    }
    this.newAgrupadas.push({ padre: 'TODAS', noticia: this.newsItems });
    this.newsItemsFiltradas = this.newsItems;
    this.dataService.setNews(this.newsItems);

    this.dataService.setAgrupadas(this.newAgrupadas);
    this.dataService.setLoaded();
  }

  guardarJson() {
    const jsonString = JSON.stringify(this.newsItems[0]);
    console.log(jsonString);
    this.sharedService.guardarNoticias(this.newsItems[0]);
  }

  agruparNoticias(nota) {
    this.newAgrupadas.map((n) => {
      nota.topic.forEach((t) => {
        if (
          n.padre == t &&
          n.noticia.filter((e) => e.id_ == nota.id_).length == 0
        ) {
          n.noticia.push(nota);
        }
      });
    });
  }
  desagruparNoticias(nota, categoria) {
    this.newAgrupadas.forEach((n) => {
      if (n.padre === categoria) {
        const index = n.noticia.findIndex((e) => e.id_ === nota.id_);
        if (index !== -1) {
          n.noticia.splice(index, 1); // Elimina el elemento del array
        }
      }
    });
  }

  // Lógica para extraer Medio y Programa
  private extractMediaAndProgram(body: string): {
    media: string;
    program: string;
  } {
    const puntoRegex = /^(.+?)\.(.+?)\./;
    const puntoMatch = body.match(puntoRegex);
    let mediaSigla;
    let programSigla;
    if (puntoMatch && !puntoMatch[1].includes('http')) {
      if (puntoMatch[1].length >= 20) {
        puntoMatch[1].split(' ')[0];
        mediaSigla = puntoMatch[1].split(' ')[0];
        programSigla = puntoMatch[1].split(' ')[1];
      } else {
        mediaSigla = puntoMatch[1].trim();
        programSigla = puntoMatch[2].trim();
      }

      const mediaObj = this.mediosYProgramas.find(
        (m) => m.sigla.toLowerCase() === mediaSigla.toLowerCase()
      );
      const programObj = this.mediosYProgramas.find(
        (p) => p.sigla.toLowerCase() === programSigla.toLowerCase()
      );
      return {
        media: mediaObj ? mediaObj.nombre : mediaSigla,
        program: programObj ? programObj.nombre : programSigla,
      };
    }
    if (body.includes('https://')) {
      let url = body.split('//')[1];
      url = url.replace('www.', '');
      const mediaObj = this.mediosYProgramas.find(
        (m) => m.sigla.toLowerCase() === url.split('.')[0].toLowerCase()
      );

      return {
        media: mediaObj ? mediaObj.nombre : url.split('.')[0],
        program: 'web',
      };
    }

    // Método 2: Buscar siglas al inicio del mensaje
    const mediaProgramRegex = /^([A-ZÁÉÍÓÚÑÜ]{1,3})\s([A-ZÁÉÍÓÚÑÜ]{1,3})\b/;

    const explicitMatch = body.match(mediaProgramRegex);
    if (explicitMatch) {
      const mediaObj = this.mediosYProgramas.find(
        (m) => m.sigla.toLowerCase() === explicitMatch[1].toLowerCase()
      );
      const programObj = this.mediosYProgramas.find(
        (p) => p.sigla.toLowerCase() === explicitMatch[2].toLowerCase()
      );
      return {
        media: mediaObj ? mediaObj.nombre : explicitMatch[1],
        program: programObj ? programObj.nombre : explicitMatch[2],
      };
    }

    return { media: '*', program: '*' };
  }

  private determineTopic(text: string) {
    const lowerCaseText = text.toLowerCase();

    const topics: { [key: string]: string[] } = {};
    this.palabrasClaveOriginal.forEach(({ palabra, padre }) => {
      // Separar múltiples padres por ';'
      const padres = padre
        .split(';')
        .map((p) => p.trim())
        .filter((p) => p);
      padres.forEach((p) => {
        if (!topics[p]) {
          topics[p] = [];
        }
        topics[p].push(palabra.toLowerCase());
      });
    });
    // Palabras clave para cada temática
    const foundTopics: string[] = [];

    for (const [topic, keywords] of Object.entries(topics)) {
      for (const keyword of keywords) {
        if (lowerCaseText.includes(keyword)) {
          foundTopics.push(topic);
          break; // Solo una coincidencia por temática es suficiente
        }
      }
    }

    return foundTopics.length > 0 ? foundTopics : ['General'];
  }
  agregarCategoria(categoria: string, i: number) {
    this.newAgrupadas = this.dataService.getAgrupadas();
    const newsItem = this.newsItems[i];

    // Toggle 'Destacadas' status
    if (categoria === 'Destacadas') {
      newsItem.destacada = !newsItem.destacada;
      if (newsItem.destacada) {
        if (!newsItem.topic.includes('Destacadas')) {
          newsItem.topic.push('Destacadas');
        }
        this.agruparNoticias(newsItem);
      } else {
        const index = newsItem.topic.indexOf('Destacadas');
        if (index > -1) {
          newsItem.topic.splice(index, 1);
        }
        this.desagruparNoticias(newsItem, 'Destacadas');
      }
    } else {
      // Add other categories
      if (!newsItem.topic.includes(categoria)) {
        newsItem.topic.push(categoria);
        this.agruparNoticias(newsItem);
      }
    }

    // Persist changes
    this.dataService.setNews(this.newsItems);
    this.dataService.setAgrupadas(this.newAgrupadas);
  }

  quitarCategoria(categoria: string, i: number) {
    this.newAgrupadas = this.dataService.getAgrupadas();
    const newsItem = this.newsItems[i];
    const topicIndex = newsItem.topic.indexOf(categoria);

    if (topicIndex > -1) {
      newsItem.topic.splice(topicIndex, 1);
      this.desagruparNoticias(newsItem, categoria);
      if (categoria === 'Destacadas') {
        newsItem.destacada = false;
      }
      this.dataService.setNews(this.newsItems);
      this.dataService.setAgrupadas(this.newAgrupadas);
    }
  }

  transform(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  resaltarTexto(texto: string, i: any) {
    const palabrasClaveOriginal = this.palabrasClaveOriginal;
    const normalizar = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    let textoResaltado = texto;

    palabrasClaveOriginal.forEach(({ palabra }) => {
      const regexStr = palabra
        .split('')
        .map((letra: string) => {
          const base = letra
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
          const vocales: { [key: string]: string } = {
            a: 'á',
            e: 'é',
            i: 'í',
            o: 'ó',
            u: 'ú',
          };
          const acento = vocales[base] || '';
          const variantes = [base, acento, letra].filter(Boolean).join('');
          return `[${variantes}]`;
        })
        .join('');

      // Simula límites de palabra incluyendo letras acentuadas
      const regex = new RegExp(
        `(^|[^\\wáéíóúÁÉÍÓÚ])(\\b${regexStr}\\b)(?=[^\\wáéíóúÁÉÍÓÚ]|$)`,
        'gi'
      );

      let cantidad = 0;
      textoResaltado = textoResaltado.replace(
        regex,
        (match, pre, palabraCoincidente) => {
          return `${pre}<span class="resaltado">${palabraCoincidente}</span>`;
        }
      );
    });
    return textoResaltado;
  }

  copy(text: any) {
    const texto =
      '->** \n' +
      '-> ' +
      text.media +
      ' / ' +
      text.program +
      '\n' +
      '🔗 ->' +
      text.link.trim();

    // '📺 | 📻 -> *Medio:* ' +
    // text.media +
    // '*\n 🎤 -> *Programa:* ' +
    // text.program +
    // '*\n🔗 -> Link:' +
    // text.link.trim() +
    // '*\n 🗣 -> Resumen:';

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

  cerrarToast() {
    if (this.toast) {
      setTimeout(() => {
        this.toast = false;
      }, 2000);
    }
  }
  // mejorarResumen(item) {
  //       item.iaResume= null;
  //       this.resumenIA(item.resume).then(resultado => {
  //        item.iaResume = resultado;
  //       });
  // }
  // async resumenIA(text: any){

  // // 🔐 Tu API Key de Google AI Studio
  // const API_KEY = "AIzaSyAtocqMrT3gzgpKmqfnkYE9aSsg3F077Kc";
  // // console.log("api key");
  // // 🧠 Inicializar el cliente
  // const genAI = new GoogleGenerativeAI(API_KEY);
  // // console.log("inicializado");

  // // 🧾 Prompt personalizado
  // const prompt = `
  // Por favor, actúa como un experto en resúmenes de texto.
  // Tarea: Quiero que resumas el siguiente texto.
  // Requisitos del resumen:
  // - Longitud: breve (17 palabras)
  // - Estilo: claro y conciso
  // - Enfoque: destacar el tema principal
  // - Respuesta en forma de titulo
  // - Evitar detalles innecesarios
  // - no agregar mas que el resumen, no hagas comentarios ni explicaciones adicionales
  // - ultiliza solo como contexto la Municipalidad de Córdoba y este array de palabras clave: ${this.palabrasClaveOriginal.map(p => p.palabra + " - " + p.padre).join(', ')}
  // Texto: ${text}
  // `;
  // try {
  //     const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  //     const result = await model.generateContent(prompt);
  //     const response = await result.response;
  //     const resumen = response.text();
  //     // console.log("📌 Resumen generado:");
  //     // console.log(resumen);
  //     return resumen;
  //   } catch (error) {
  //     return "❌ Error al generar el resumen:" + error;
  //   }
  // }
}
