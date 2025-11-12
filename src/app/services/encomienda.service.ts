import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';

export interface Encomienda {
  _id?: string;
  codigoSeguimiento: string;
  remitente: { 
    nombre: string; 
    email?: string; 
    telefono?: string; 
    ciudad?: string; 
    direccion?: string; 
  };
  destinatario: { 
    nombre: string; 
    email?: string; 
    telefono?: string; 
    ciudad?: string; 
    direccion?: string; 
  };
  valor: number;
  peso?: number;
  estado: 'pendiente' | 'en_transito' | 'entregada' | 'incidencia' | 'cancelada';
  descripcion?: string;
  fechaCreacion?: Date;
  fechaEntrega?: Date;
  chofer?: any;
  porcentajeEntrega?: number;
}

@Injectable({ 
  providedIn: 'root' 
})
export class EncomiendaService {
  private apiUrl = 'http://localhost:3000/api';
  
  // ✅ SIGNALS (Angular 17+)
  encomiendas = signal<Encomienda[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // ✅ BEHAVIOR SUBJECTS (Compatibilidad)
  private encomiendas$ = new BehaviorSubject<Encomienda[]>([]);
  private cargando$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);
  private encomiendasCache$: Observable<Encomienda[]> | null = null;

  constructor(private http: HttpClient) {
    console.log('📦 EncomiendaService inicializado');
  }

  /**
   * ✅ Carga todas las encomiendas (con caché)
   */
  cargarEncomiendas(estado?: string): Observable<Encomienda[]> {
    // Si hay cache y no hay filtro, devolver cache
    if (this.encomiendasCache$ && !estado) {
      return this.encomiendasCache$;
    }

    this.cargando.set(true);
    this.cargando$.next(true);
    this.error.set(null);
    this.error$.next(null);
    
    console.log('📦 Cargando encomiendas...', estado ? `(filtro: ${estado})` : '');

    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }

    this.encomiendasCache$ = this.http.get<{ encomiendas: Encomienda[] }>(
      `${this.apiUrl}/encomiendas`,
      { params }
    ).pipe(
      map(response => response.encomiendas),
      tap(encomiendas => {
        console.log('✅ Encomiendas cargadas:', encomiendas.length);
        this.encomiendas.set(encomiendas);
        this.encomiendas$.next(encomiendas);
      }),
      shareReplay(1),
      catchError(err => {
        console.error('❌ Error cargando:', err);
        this.error.set('Error al cargar encomiendas');
        this.error$.next('Error al cargar encomiendas');
        return this.getEncomiendasLocales();
      }),
      finalize(() => {
        this.cargando.set(false);
        this.cargando$.next(false);
      })
    );

    return this.encomiendasCache$;
  }

  /**
   * ✅ Obtiene encomiendas como observable
   */
  getEncomiendas$(): Observable<Encomienda[]> {
    return this.encomiendas$.asObservable();
  }

  /**
   * ✅ Obtiene estado de carga
   */
  getCargando$(): Observable<boolean> {
    return this.cargando$.asObservable();
  }

  /**
   * ✅ Obtiene errores
   */
  getError$(): Observable<string | null> {
    return this.error$.asObservable();
  }

  /**
   * ✅ Obtiene encomiendas locales (fallback)
   */
  private getEncomiendasLocales(): Observable<Encomienda[]> {
    console.log('📚 Usando encomiendas locales');
    return this.encomiendas$.asObservable();
  }

  /**
   * ✅ Obtiene todas las encomiendas
   */
  obtenerEncomiendas(): Observable<Encomienda[]> {
    return this.cargarEncomiendas();
  }

  /**
   * ✅ Obtiene una encomienda por ID
   */
  obtenerEncomiendaPorId(id: string): Observable<Encomienda> {
    console.log('🔍 Buscando encomienda:', id);
    return this.http.get<Encomienda>(`${this.apiUrl}/encomiendas/${id}`).pipe(
      tap(encomienda => console.log('✅ Encontrada:', encomienda)),
      catchError(err => {
        console.error('❌ Error:', err);
        this.error.set('Encomienda no encontrada');
        this.error$.next('Encomienda no encontrada');
        return throwError(() => err);
      })
    );
  }

  /**
   * ✅ Obtiene encomienda por código de seguimiento
   */
  obtenerPorCodigo(codigo: string): Observable<Encomienda> {
    console.log('🔍 Buscando:', codigo);
    return this.http.get<Encomienda>(`${this.apiUrl}/encomiendas/codigo/${codigo}`).pipe(
      tap(e => console.log('✅ Encontrada:', e)),
      catchError(err => {
        this.error.set('Código no válido');
        this.error$.next('Código no válido');
        return throwError(() => err);
      })
    );
  }

  /**
   * ✅ Crea una nueva encomienda
   */
  crearEncomienda(datos: Partial<Encomienda>): Observable<Encomienda> {
    this.cargando.set(true);
    this.cargando$.next(true);
    console.log('📝 Creando encomienda...');

    const encomienda: Encomienda = {
      codigoSeguimiento: this.generarCodigo(),
      estado: 'pendiente',
      valor: datos.valor || 0,
      remitente: datos.remitente || { nombre: '', ciudad: '', direccion: '' },
      destinatario: datos.destinatario || { nombre: '', ciudad: '', direccion: '' },
      descripcion: datos.descripcion,
      peso: datos.peso,
      fechaCreacion: new Date()
    };

    return this.http.post<Encomienda>(`${this.apiUrl}/encomiendas`, encomienda).pipe(
      tap(nueva => {
        console.log('✅ Creada:', nueva);
        const lista = this.encomiendas();
        this.encomiendas.set([...lista, nueva]);
        this.encomiendas$.next([...lista, nueva]);
        this.encomiendasCache$ = null; // ✅ Limpiar cache
        alert(`✅ Creada: ${nueva.codigoSeguimiento}`);
      }),
      catchError(err => {
        console.error('❌ Error:', err);
        const msg = err.error?.message || 'Error al crear';
        this.error.set(msg);
        this.error$.next(msg);
        alert(`❌ ${msg}`);
        return throwError(() => err);
      }),
      finalize(() => {
        this.cargando.set(false);
        this.cargando$.next(false);
      })
    );
  }

  /**
   * ✅ Actualiza una encomienda
   */
  actualizarEncomienda(id: string, datos: Partial<Encomienda>): Observable<Encomienda> {
    this.cargando.set(true);
    this.cargando$.next(true);
    console.log('✏️ Actualizando:', id);

    return this.http.patch<Encomienda>(`${this.apiUrl}/encomiendas/${id}`, datos).pipe(
      tap(actualizada => {
        console.log('✅ Actualizada:', actualizada);
        const lista = this.encomiendas().map(e => e._id === id ? actualizada : e);
        this.encomiendas.set(lista);
        this.encomiendas$.next(lista);
        this.encomiendasCache$ = null; // ✅ Limpiar cache
        alert('✅ Actualizada');
      }),
      catchError(err => {
        console.error('❌ Error:', err);
        const msg = err.error?.message || 'Error al actualizar';
        this.error.set(msg);
        this.error$.next(msg);
        alert(`❌ ${msg}`);
        return throwError(() => err);
      }),
      finalize(() => {
        this.cargando.set(false);
        this.cargando$.next(false);
      })
    );
  }

  /**
   * ✅ Actualiza el estado de una encomienda
   */
  actualizarEstado(id: string, estado: string): Observable<Encomienda> {
    console.log(`📄 Cambiando estado a: ${estado}`);
    return this.actualizarEncomienda(id, { estado: estado as any });
  }

  /**
   * ✅ Marca encomienda como entregada
   */
  marcarEntregada(id: string, datos: any): Observable<any> {
    this.cargando.set(true);
    this.cargando$.next(true);
    console.log('✅ Entregando:', id);

    return this.http.patch<any>(`${this.apiUrl}/encomiendas/${id}/entregar`, datos).pipe(
      tap(e => {
        console.log('✅ Confirmada:', e);
        const encomienda = e.encomienda || e;
        const lista = this.encomiendas().map(x => x._id === id ? encomienda : x);
        this.encomiendas.set(lista);
        this.encomiendas$.next(lista);
        this.encomiendasCache$ = null; // ✅ Limpiar cache
        alert('✅ Entrega confirmada');
      }),
      catchError(err => {
        console.error('❌ Error:', err);
        const msg = err.error?.message || 'Error';
        this.error.set(msg);
        this.error$.next(msg);
        alert(`❌ ${msg}`);
        return throwError(() => err);
      }),
      finalize(() => {
        this.cargando.set(false);
        this.cargando$.next(false);
      })
    );
  }

  /**
   * ✅ Elimina una encomienda
   */
  eliminarEncomienda(id: string): Observable<any> {
    this.cargando.set(true);
    this.cargando$.next(true);
    console.log('🗑️ Eliminando:', id);

    return this.http.delete(`${this.apiUrl}/encomiendas/${id}`).pipe(
      tap(() => {
        console.log('✅ Eliminada');
        const lista = this.encomiendas().filter(e => e._id !== id);
        this.encomiendas.set(lista);
        this.encomiendas$.next(lista);
        this.encomiendasCache$ = null; // ✅ Limpiar cache
        alert('✅ Eliminada');
      }),
      catchError(err => {
        console.error('❌ Error:', err);
        const msg = err.error?.message || 'Error';
        this.error.set(msg);
        this.error$.next(msg);
        alert(`❌ ${msg}`);
        return throwError(() => err);
      }),
      finalize(() => {
        this.cargando.set(false);
        this.cargando$.next(false);
      })
    );
  }

  /**
   * ✅ Filtra encomiendas por estado
   */
  filtrarPorEstado(estado: string): Observable<Encomienda[]> {
    console.log('🔎 Filtrando:', estado);
    this.encomiendasCache$ = null; // ✅ Limpiar cache para nuevo filtro
    return this.cargarEncomiendas(estado);
  }

  /**
   * ✅ Obtiene encomiendas de un chofer
   */
  obtenerEncomiendasChofer(choferId: string): Observable<Encomienda[]> {
    console.log('🚗 Del chofer:', choferId);
    return this.http.get<{ encomiendas: Encomienda[] }>(
      `${this.apiUrl}/encomiendas/chofer/${choferId}`
    ).pipe(
      map(response => response.encomiendas),
      tap(encomiendas => console.log('✅ Obtenidas:', encomiendas.length)),
      catchError(err => {
        console.error('❌ Error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * ✅ Asigna chofer a una encomienda
   */
  asignarChofer(encomiendaId: string, choferId: string): Observable<Encomienda> {
    console.log('👤 Asignando:', choferId);
    return this.http.patch<Encomienda>(
      `${this.apiUrl}/encomiendas/${encomiendaId}/chofer`,
      { choferId }
    ).pipe(
      tap(e => {
        console.log('✅ Asignado');
        const lista = this.encomiendas().map(x => x._id === encomiendaId ? e : x);
        this.encomiendas.set(lista);
        this.encomiendas$.next(lista);
        this.encomiendasCache$ = null; // ✅ Limpiar cache
      }),
      catchError(err => {
        console.error('❌ Error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * ✅ Exporta a CSV
   */
  exportarCSV(encomiendas?: Encomienda[]): void {
    const lista = encomiendas || this.encomiendas();
    console.log('📥 Exportando:', lista.length);

    const headers = ['Código', 'Remitente', 'Destinatario', 'Valor', 'Estado', 'Fecha'];
    const data = lista.map(e => [
      e.codigoSeguimiento,
      e.remitente.nombre,
      e.destinatario.nombre,
      e.valor,
      e.estado,
      new Date(e.fechaCreacion || '').toLocaleDateString()
    ]);

    const csv = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `encomiendas-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('✅ Descargado');
  }

  /**
   * ✅ Limpia errores
   */
  limpiarError(): void {
    this.error.set(null);
    this.error$.next(null);
  }

  /**
   * ✅ Genera código de seguimiento
   */
  private generarCodigo(): string {
    return 'ENC' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
}