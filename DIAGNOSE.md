# 🔍 Diagnóstico del Problema

## Errores Observados

```
Invariant Violation: Failed to call into JavaScript module method RCTNativeAppEventEmitter.emit()
Module has not been registered as callable
Registered callable JavaScript modules (n = 0)
```

Este error significa que **NINGÚN** módulo JavaScript se registró correctamente.

## Posibles Causas

### 1. Bundle JavaScript Corrupto o No Cargó
- El archivo JS no se generó correctamente
- Hay un error de sintaxis temprano que mata todo
- Los polyfills están interfiriendo

### 2. Problema con index.js
El `index.js` actual tiene muchos polyfills que pueden estar causando problemas:
- `react-native-gesture-handler`
- `react-native-get-random-values`
- `react-native-url-polyfill/auto`
- Buffer/process globals

### 3. Incompatibilidad de Versiones
- Expo 52 vs React Native 0.76
- React 18 vs dependencias que esperan React 19
- @reown/appkit con React Native

### 4. Metro Bundler Config
El `metro.config.js` tiene proxies y mocks que podrían estar interfiriendo.

## Plan de Acción

### Test 1: Proyecto Limpio ✅
```bash
cd test-app
npm start
```

**Si funciona**: El problema está en el proyecto principal
**Si falla**: El problema es con el setup de Expo/iOS

### Test 2: Simplificar index.js
Remover TODOS los polyfills y dejar solo:
```javascript
import { registerRootComponent } from "expo";
import App from "./App";
registerRootComponent(App);
```

### Test 3: App Mínima
```javascript
import { View, Text } from "react-native";
export default function App() {
  return <View><Text>Test</Text></View>;
}
```

### Test 4: Agregar ethers Gradualmente
1. Instalar ethers
2. Importar ethers (sin usar)
3. Usar ethers.Wallet.createRandom()
4. Agregar fetch al relayer

## Comandos de Debug

### Ver logs completos de Metro
```bash
npx expo start --clear 2>&1 | tee metro.log
```

### Ver logs del simulador
```bash
xcrun simctl spawn booted log stream --level=debug | grep -i "React"
```

### Limpiar TODO
```bash
rm -rf node_modules
rm -rf .expo
rm -rf ios/build
rm -rf android/build
npm install
npx expo start --clear
```

### Verificar que no hay procesos de Metro corriendo
```bash
lsof -ti:8081
pkill -f "expo start"
pkill -f "react-native"
```

## Solución Probable

El problema parece estar en la combinación de:
1. Polyfills en index.js
2. Metro bundler con mocks
3. Dependencias de Reown/WalletConnect

**Solución**: Empezar desde el proyecto limpio y agregar funcionalidad gradualmente.
