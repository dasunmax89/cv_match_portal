import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateLayout } from './candidate-layout.component';

describe('CandidateLayout', () => {
  let component: CandidateLayout;
  let fixture: ComponentFixture<CandidateLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(CandidateLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
