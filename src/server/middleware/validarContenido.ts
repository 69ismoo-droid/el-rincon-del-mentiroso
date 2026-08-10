import { Request, Response, NextFunction } from 'express';
import { contieneGroserias } from '../utils/profanityFilter.js';

/**
 * Middleware para validar que los campos especificados no contengan lenguaje inapropiado
 * @param campos - Array de nombres de campos a validar en req.body
 */
export function validarContenidoLimpio(campos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const camposConGroserias: string[] = [];

    for (const campo of campos) {
      const valor = req.body[campo];
      
      if (valor && typeof valor === 'string') {
        if (contieneGroserias(valor)) {
          camposConGroserias.push(campo);
        }
      }
    }

    if (camposConGroserias.length > 0) {
      res.status(400).json({
        error: 'El contenido contiene lenguaje inapropiado',
        campos: camposConGroserias,
        mensaje: 'Por favor, mantén un lenguaje respetuoso en la comunidad.'
      });
      return;
    }

    next();
  };
}
