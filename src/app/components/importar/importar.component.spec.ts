import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportarComponent } from './importar.component';

describe('ImportarComponent', () => {
  let component: ImportarComponent;
  let fixture: ComponentFixture<ImportarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ImportarComponent]
    });
    fixture = TestBed.createComponent(ImportarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
