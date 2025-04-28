import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArticlePersonaliserDetailComponent } from './article-personaliser-detail.component';

describe('ArticlePersonaliserDetailComponent', () => {
  let component: ArticlePersonaliserDetailComponent;
  let fixture: ComponentFixture<ArticlePersonaliserDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArticlePersonaliserDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArticlePersonaliserDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
