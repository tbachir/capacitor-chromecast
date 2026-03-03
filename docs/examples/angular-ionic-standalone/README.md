# Ionic Angular Standalone — ChromecastService

Service Angular production-ready (`chromecast.service.ts`) avec :
- `@Injectable({ providedIn: 'root' })` pour etre disponible partout
- State via Angular Signals + `toObservable()` pour interop RxJS
- Selecteurs `computed()` prets pour le template (`session`, `receiverAvailable`, `media`, etc.)
- Teardown automatique via `DestroyRef`
- Garde contre la double-initialisation (`initInFlight`, `bindListenersInFlight`)

Voir [docs/GUIDE.md](../../GUIDE.md) section 9 pour l'exemple d'utilisation dans un composant standalone.
