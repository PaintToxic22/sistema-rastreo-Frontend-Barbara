import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private apiUrl = 'http://localhost:3000/api/tracking';

  constructor(private http: HttpClient) { }

  rastrearPorCodigo(codigoSeguimiento: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${codigoSeguimiento}`);
  }

  obtenerMisEncomiendas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/usuario/mis-encomiendas`);
  }

  obtenerDetallesTracking(codigoSeguimiento: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/detalles/${codigoSeguimiento}`);
  }

  obtenerEstadisticasGlobales(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats/globales`);
  }
}