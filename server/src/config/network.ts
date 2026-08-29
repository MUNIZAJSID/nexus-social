import os from 'os';
import { ENV } from './env';

export interface NetworkAddress {
  interface: string;
  address: string;
  family: string;
}

/**
 * Obtém todos os endereços IPv4 locais não internos da máquina servidora
 */
export function getLocalIPAddresses(): NetworkAddress[] {
  const interfaces = os.networkInterfaces();
  const addresses: NetworkAddress[] = [];

  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (!netList) continue;

    for (const net of netList) {
      // Filtra apenas IPv4 e ignora 127.0.0.1
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({
          interface: name,
          address: net.address,
          family: net.family,
        });
      }
    }
  }

  return addresses;
}

/**
 * Imprime o banner no terminal com as instruções e links de acesso
 */
export function printServerBanner(port: number = ENV.PORT, clientPort: number = 3000) {
  const ips = getLocalIPAddresses();
  const primaryIP = ips.length > 0 ? ips[0].address : '192.168.X.X';

  console.log('\n' + '='.repeat(68));
  console.log('       🚀  LOCALSOCIAL - SERVIDOR LOCAL MULTIUSUÁRIO ONLINE  🚀');
  console.log('='.repeat(68));
  console.log(`\n💻 ACESSO NESTE COMPUTADOR (Localhost):`);
  console.log(`   👉 Aplicação (Frontend): http://localhost:${clientPort}`);
  console.log(`   👉 API Backend:         http://localhost:${port}/api`);
  console.log(`   👉 Mídias / Storage:     http://localhost:${port}/storage`);

  console.log(`\n📱 ACESSO POR OUTROS COMPUTADORES / CELULARES NA MESMA REDE (Wi-Fi/LAN):`);
  if (ips.length > 0) {
    ips.forEach((item) => {
      console.log(`   👉 [${item.interface}]: http://${item.address}:${clientPort}`);
    });
  } else {
    console.log(`   👉 http://${primaryIP}:${clientPort}`);
  }

  console.log(`\n🛡️ CONTA ADMINISTRADOR PADRÃO:`);
  console.log(`   👉 Usuário:  ${ENV.ADMIN_USERNAME}`);
  console.log(`   👉 Senha:    ${ENV.ADMIN_PASSWORD}`);
  console.log(`   👉 Painel:   http://localhost:${clientPort}/admin`);

  console.log('\n💡 DICA: Para que outros celulares e PCs entrem, conecte-os');
  console.log('   no mesmo Wi-Fi e abra o link do IP da Rede Local acima no navegador.');
  console.log('='.repeat(68) + '\n');
}
