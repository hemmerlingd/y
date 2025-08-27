import { Component, inject, Input } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';
import { DataService } from 'src/app/shared/data.service';


@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent {
   categorias: string[] = [];
 @Input() items: Array<{padre: string; noticia:any[]}> =[];
  dataService = inject(DataService);
  
  constructor(private sharedService:SharedService){
    
    
  }

}
