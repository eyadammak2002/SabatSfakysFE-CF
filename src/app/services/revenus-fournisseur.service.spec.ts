import { TestBed } from '@angular/core/testing';

import { RevenusFournisseurService } from './revenus-fournisseur.service';

describe('RevenusFournisseurService', () => {
  let service: RevenusFournisseurService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RevenusFournisseurService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
