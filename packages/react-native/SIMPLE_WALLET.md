# 📱 Simple FHE Mobile Wallet

Versión ultra-simple: El usuario ingresa su private key → El relayer la usa para encriptar/desencriptar.

## 🎯 Flujo

```
Usuario ingresa private key en la app
    ↓
App envía key al relayer (+ crea sesión)
    ↓
Usuario presiona "Refresh" o "Increment"
    ↓
Relayer usa esa key para:
  - Encriptar valores (antes de enviar tx)
  - Desencriptar valores (después de leer)
    ↓
Usuario ve el resultado
```

## 🚀 Setup Rápido

### 1. Configurar RPC URL

Edita `packages/relayer-service/.env`:
```bash
RPC_URL=https://sepolia.infura.io/v3/TU_PROJECT_ID_AQUI
```

Obtén un Project ID gratis en: https://infura.io

### 2. Iniciar Relayer

```bash
pnpm relayer:dev
```

Deberías ver:
```
🚀 Simple FHEVM Relayer
📍 http://localhost:4000
⛓️  Chain: Sepolia (11155111)
🔐 Mode: User provides private key
```

### 3. Iniciar App

```bash
pnpm mobile
# Presiona 'i' para iOS o 'a' para Android
```

### 4. Usar la App

1. **Ingresa tu private key** (sin 0x o con 0x, ambos funcionan)
2. **Relayer URL**:
   - iOS: `http://localhost:4000` (default)
   - Android: `http://10.0.2.2:4000`
   - Físico: `http://TU_IP:4000`
3. **Presiona "Connect"**
4. **Espera** a que se cree la sesión (~5 seg)
5. **Presiona "Refresh"** para leer el contador
6. **Presiona "Increment"** para incrementarlo

## ⚠️ Seguridad

**SOLO PARA DESARROLLO Y PRUEBAS**

- ❌ NO uses tu wallet principal
- ❌ NO pongas fondos reales
- ✅ Crea una wallet de prueba
- ✅ Solo pon ~0.1 ETH de Sepolia

## 🔑 Crear Wallet de Prueba

### Opción 1: MetaMask
1. Abre MetaMask
2. Click en el icono de perfil
3. "Añadir cuenta" o "Crear cuenta"
4. Cambia a Sepolia testnet
5. Click en ⋮ → "Detalles de la cuenta"
6. "Exportar clave privada"
7. Copia y pégala en la app

### Opción 2: Generar con Ethers (Node.js)
```javascript
const ethers = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
```

### Obtener ETH de Sepolia (Gratis)

Faucets:
- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

## 🐛 Troubleshooting

### "Unable to resolve..."
```bash
npx expo start --clear
```

### "Session error: HTTP 500"
- Verifica que el relayer esté corriendo
- Verifica la RPC_URL en `.env`
- Mira los logs del relayer

### "Invalid private key"
- Debe tener 64 caracteres hex (sin 0x) o 66 (con 0x)
- Ejemplo: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### "Signature mismatch"
- La private key no coincide con la address
- Asegúrate de copiar bien la key

### Pantalla en blanco
- Abre la consola del navegador/simulador (CMD+D → "Show Inspector")
- Mira los errores

## 📁 Archivos

- **`App.tsx`** - App simple (actual)
- **`App.reown.tsx`** - Versión con Reown/WalletConnect (backup)
- **`App.old.tsx`** - Versión original con ephemeral wallet (backup)

Para volver a la versión con Reown:
```bash
mv App.tsx App.simple.tsx
mv App.reown.tsx App.tsx
```

## 🎉 Eso es Todo!

Solo 4 pasos:
1. RPC URL en `.env`
2. `pnpm relayer:dev`
3. `pnpm mobile`
4. Ingresa private key → Usa FHE!

Super simple. Sin WalletConnect, sin complejidad.
