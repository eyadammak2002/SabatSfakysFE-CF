import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailArticleAvisComponent } from './detail-article-avis.component';

describe('DetailArticleAvisComponent', () => {
  let component: DetailArticleAvisComponent;
  let fixture: ComponentFixture<DetailArticleAvisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailArticleAvisComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailArticleAvisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
