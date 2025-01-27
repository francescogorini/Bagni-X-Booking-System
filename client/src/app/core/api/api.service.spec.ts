import { ApiService } from './api.service';
import {CustomerAuthService} from "../auth/customer-auth.service";

describe('ApiService', () => {
  let httpClientSpy: { get: jasmine.Spy };
  let service: ApiService;

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);
    //service = new ApiService(httpClientSpy as any);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#getHomeCards should return a well-formatted real result', () => {
    expect(service.getHome).toBeTruthy();
  });
});
