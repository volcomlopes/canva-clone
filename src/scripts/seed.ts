import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";

import {
  users,
  brands,
  dealerships,
} from "../db/schema";

// Carrega variáveis do .env.local
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// ============================================
// CONFIGURAÇÃO — Mude aqui se quiser
// ============================================
// ⚠️ IMPORTANTE: Coloque AQUI o email que você usa pra logar no Artbase
// (o mesmo email Google que você usa)
const SEU_EMAIL = "volcomlopes@gmail.com";

// ============================================
// SCRIPT DE SEED
// ============================================
async function seed() {
  console.log("🌱 Iniciando seed do Artbase...\n");

  try {
    // ========================================
    // ETAPA 1: Criar a marca GWM
    // ========================================
    console.log("🏢 Criando marca GWM...");

    // Verifica se já existe
    const existingBrand = await db
      .select()
      .from(brands)
      .where(eq(brands.slug, "gwm"))
      .limit(1);

    let gwmBrand;
    if (existingBrand[0]) {
      console.log("   ⚠️  Marca GWM já existe, pulando criação");
      gwmBrand = existingBrand[0];
    } else {
      const result = await db
        .insert(brands)
        .values({
          name: "GWM Brasil",
          slug: "gwm",
          logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Great_Wall_Motors_logo.svg/200px-Great_Wall_Motors_logo.svg.png",
          primaryColor: "#E60012",
          secondaryColor: "#000000",
          active: true,
        })
        .returning();
      gwmBrand = result[0];
      console.log(`   ✅ Marca GWM criada (ID: ${gwmBrand.id})`);
    }

    // ========================================
    // ETAPA 2: Criar 2 unidades (concessionárias)
    // ========================================
    console.log("\n🏪 Criando unidades GWM...");

    // Auto Brasil
    const existingAutoBrasil = await db
      .select()
      .from(dealerships)
      .where(eq(dealerships.name, "GWM Auto Brasil"))
      .limit(1);

    let autoBrasil;
    if (existingAutoBrasil[0]) {
      console.log("   ⚠️  Auto Brasil já existe, pulando");
      autoBrasil = existingAutoBrasil[0];
    } else {
      const result = await db
        .insert(dealerships)
        .values({
          brandId: gwmBrand.id,
          name: "GWM Auto Brasil",
          cnpj: "12.345.678/0001-90",
          city: "São Paulo",
          state: "SP",
          phone: "(11) 4000-1234",
          address: "Av. Paulista, 1000 - Bela Vista",
          active: true,
        })
        .returning();
      autoBrasil = result[0];
      console.log(`   ✅ Auto Brasil criada (ID: ${autoBrasil.id})`);
    }

    // Pinheiros Motors
    const existingPinheiros = await db
      .select()
      .from(dealerships)
      .where(eq(dealerships.name, "GWM Pinheiros Motors"))
      .limit(1);

    let pinheirosMotors;
    if (existingPinheiros[0]) {
      console.log("   ⚠️  Pinheiros Motors já existe, pulando");
      pinheirosMotors = existingPinheiros[0];
    } else {
      const result = await db
        .insert(dealerships)
        .values({
          brandId: gwmBrand.id,
          name: "GWM Pinheiros Motors",
          cnpj: "98.765.432/0001-10",
          city: "São Paulo",
          state: "SP",
          phone: "(11) 4000-5678",
          address: "Av. Faria Lima, 2500 - Pinheiros",
          active: true,
        })
        .returning();
      pinheirosMotors = result[0];
      console.log(`   ✅ Pinheiros Motors criada (ID: ${pinheirosMotors.id})`);
    }

    // ========================================
    // ETAPA 3: Promover seu usuário pra Super Admin
    // ========================================
    console.log("\n👑 Configurando seu usuário como Super Admin...");

    if (SEU_EMAIL.includes("COLOCAR_SEU_EMAIL")) {
      console.log("   ❌ ATENÇÃO: Você não trocou o email no arquivo!");
      console.log("   ❌ Edite a constante SEU_EMAIL no topo do seed.ts");
    } else {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, SEU_EMAIL))
        .limit(1);

      if (!existingUser[0]) {
        console.log(`   ⚠️  Usuário com email ${SEU_EMAIL} não encontrado.`);
        console.log("   ⚠️  Faça login pelo menos 1 vez antes de rodar o seed!");
      } else {
        await db
          .update(users)
          .set({
            role: "super_admin",
            brandId: null,
            dealershipId: null,
          })
          .where(eq(users.email, SEU_EMAIL));
        console.log(`   ✅ Você (${SEU_EMAIL}) agora é Super Admin!`);
      }
    }

    // ========================================
    // ETAPA 4: Criar usuários fictícios
    // ========================================
    console.log("\n👥 Criando usuários fictícios...");

    const usuariosFicticios = [
      {
        email: "joao@gwm.com.br",
        name: "João - Admin GWM",
        role: "brand_admin" as const,
        brandId: gwmBrand.id,
        dealershipId: null,
      },
      {
        email: "maria@autobrasil.com.br",
        name: "Maria - Admin Auto Brasil",
        role: "dealership_admin" as const,
        brandId: gwmBrand.id,
        dealershipId: autoBrasil.id,
      },
      {
        email: "pedro@autobrasil.com.br",
        name: "Pedro - Vendedor Auto Brasil",
        role: "user" as const,
        brandId: gwmBrand.id,
        dealershipId: autoBrasil.id,
      },
    ];

    for (const userData of usuariosFicticios) {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existing[0]) {
        console.log(`   ⚠️  ${userData.name} já existe, atualizando role...`);
        await db
          .update(users)
          .set({
            role: userData.role,
            brandId: userData.brandId,
            dealershipId: userData.dealershipId,
            name: userData.name,
          })
          .where(eq(users.email, userData.email));
      } else {
        await db.insert(users).values(userData);
        console.log(`   ✅ ${userData.name} criado`);
      }
    }

    // ========================================
    // RESUMO FINAL
    // ========================================
    console.log("\n" + "=".repeat(50));
    console.log("✨ SEED CONCLUÍDO COM SUCESSO!");
    console.log("=".repeat(50));
    console.log("\n📊 Resumo:");
    console.log(`   🏢 Marca: GWM Brasil`);
    console.log(`   🏪 Unidades: Auto Brasil, Pinheiros Motors`);
    console.log(`   👑 Super Admin: ${SEU_EMAIL}`);
    console.log(`   👥 Usuários fictícios: 3 criados`);
    console.log("\n💡 Próximo passo: visualizar no Drizzle Studio");
    console.log("   Rode: npm run db:studio\n");

  } catch (error) {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  }
}

seed();