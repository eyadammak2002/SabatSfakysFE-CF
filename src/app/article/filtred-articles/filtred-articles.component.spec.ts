import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltredArticlesComponent } from './filtred-articles.component';

describe('FiltredArticlesComponent', () => {
  let component: FiltredArticlesComponent;
  let fixture: ComponentFixture<FiltredArticlesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FiltredArticlesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FiltredArticlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
