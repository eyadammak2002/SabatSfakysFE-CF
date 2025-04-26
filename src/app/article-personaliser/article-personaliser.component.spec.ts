import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArticlePersonaliserComponent } from './article-personaliser.component';

describe('ArticlePersonaliserComponent', () => {
  let component: ArticlePersonaliserComponent;
  let fixture: ComponentFixture<ArticlePersonaliserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArticlePersonaliserComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArticlePersonaliserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
