import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rest } from './rest';

describe('Rest', () => {
  let component: Rest;
  let fixture: ComponentFixture<Rest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Rest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
