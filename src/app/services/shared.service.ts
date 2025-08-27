import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, Observable } from 'rxjs';



@Injectable({
  providedIn: 'root',
})
export class SharedService {
  sheetPalabrasClave: string = '1ELi_nCP6XEh4VjB5jTbw8mD7ma2L67qTxPHRwWv6xak';
  private apiUrl = 'http://localhost:11434/api/generate';

  private apiKey =
    'APY01PYUr19KA42ahpFC3sTaaH3Mict1zkg8eaCBZZVW7wGq42d7trTb7Vjz6WQoDy-GFQUaPKvjjo8576TjMXj-';

  constructor(private http: HttpClient) {}

  async getPalabrasClave() {
    const URL = `https://docs.google.com/spreadsheets/d/${this.sheetPalabrasClave}/gviz/tq?tqx=out:json`;
    return this.http.get(URL, { responseType: 'text' });
  }

  generarResumen(texto: string) {
    const body = {
      model: 'gpt-oss:20b', // o el modelo que tengas instalado
      prompt: `Resume el siguiente texto en una sola oración de no mas de 30 palabras:\n\n${texto}`,
    };

    return this.http.post<any>(this.apiUrl, body);
  }

  guardarNoticias(data: any) {
    const username = 'ctrolmedios';
    const appPassword = 'BKIY FRDk izuM Rhrt LhW5 3ACe'; // sin espacios si lo pegás
    const credentials = btoa(`${username}:${appPassword}`);
    const titulo = data.iaResume;
    fetch('https://pruebas01.dev.cordoba.gob.ar/wp-json/wp/v2/noticia', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        title: titulo,
        content: 'Contenido enriquecido',
        status: 'publish',
        acf: {
          ...data,
        },
      }),
    })
      .then((res) =>
        res.ok ? res.json() : Promise.reject('❌ Error al guardar')
      )
      .then((json) => console.log('✅ Guardado:', json))
      .catch((error) => console.error('🚨 Error:', error));
  }

  ActualizarNoticias(data: any) {
    const id = data.id;
    const username = 'ctrolmedios';
    const appPassword = 'BKIY FRDk izuM Rhrt LhW5 3ACe'; // sin espacios si lo pegás
    const credentials = btoa(`${username}:${appPassword}`);
    const titulo = data.iaResume;
    fetch('https://pruebas01.dev.cordoba.gob.ar/wp-json/wp/v2/noticia/' + id, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        title: titulo,
        content: 'Contenido enriquecido',
        status: 'publish',
        acf: {
          ...data,
        },
      }),
    })
      .then((res) =>
        res.ok ? res.json() : Promise.reject('❌ Error al guardar')
      )
      .then((json) => console.log('✅ Actualizado:', json))
      .catch((error) => console.error('🚨 Error:', error));
  }

  leerNoticias(): Observable<any[]> {
    let allNews: any[] = [];
    let page = 1;
    const perPage = 100; // Puedes ajustar este valor según lo que permita la API


    const getPage = (): Promise<any> => {
      return this.http.get(`https://pruebas01.dev.cordoba.gob.ar/wp-json/wp/v2/noticia?per_page=${perPage}&page=${page}&nocache=${Date.now()}`, { responseType: 'json' })
        .toPromise()
        .then((news: any) => {
          allNews = allNews.concat(news);
          if (news.length === perPage) {
            page++;
            return getPage();
          } else {
            return allNews;
          }
        })
        .catch((error) => {
          console.error('Error fetching news:', error);
          throw error; // Re-lanza el error para que el componente pueda manejarlo
        });
    };

    return from(getPage());
  }
}
