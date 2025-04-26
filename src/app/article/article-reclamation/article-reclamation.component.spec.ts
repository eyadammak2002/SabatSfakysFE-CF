import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArticleReclamationComponent } from './article-reclamation.component';

describe('ArticleReclamationComponent', () => {
  let component: ArticleReclamationComponent;
  let fixture: ComponentFixture<ArticleReclamationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArticleReclamationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArticleReclamationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
