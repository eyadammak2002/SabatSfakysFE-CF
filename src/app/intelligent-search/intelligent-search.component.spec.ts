import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntelligentSearchComponent } from './intelligent-search.component';

describe('IntelligentSearchComponent', () => {
  let component: IntelligentSearchComponent;
  let fixture: ComponentFixture<IntelligentSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IntelligentSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IntelligentSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
