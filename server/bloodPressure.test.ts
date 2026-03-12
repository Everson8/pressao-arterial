import { describe, expect, it } from "vitest";
import { classifyBloodPressure, formatBP } from "../shared/bloodPressure";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Classificação da Pressão Arterial ──────────────────────────────────────

describe("classifyBloodPressure", () => {
  it("classifica como Normal quando sistólica < 120 e diastólica < 80", () => {
    const result = classifyBloodPressure(115, 75);
    expect(result.category).toBe("normal");
    expect(result.label).toBe("Normal");
  });

  it("classifica como Elevada quando sistólica 120-129 e diastólica < 80", () => {
    const result = classifyBloodPressure(125, 78);
    expect(result.category).toBe("elevated");
  });

  it("não classifica como Elevada quando diastólica >= 80 mesmo com sistólica 120-129", () => {
    const result = classifyBloodPressure(125, 82);
    expect(result.category).toBe("hypertension_stage1");
  });

  it("classifica como Hipertensão Estágio 1 quando sistólica 130-139", () => {
    const result = classifyBloodPressure(135, 75);
    expect(result.category).toBe("hypertension_stage1");
  });

  it("classifica como Hipertensão Estágio 1 quando diastólica 80-89", () => {
    const result = classifyBloodPressure(118, 85);
    expect(result.category).toBe("hypertension_stage1");
  });

  it("classifica como Hipertensão Estágio 2 quando sistólica >= 140", () => {
    const result = classifyBloodPressure(145, 75);
    expect(result.category).toBe("hypertension_stage2");
  });

  it("classifica como Hipertensão Estágio 2 quando diastólica >= 90", () => {
    const result = classifyBloodPressure(118, 92);
    expect(result.category).toBe("hypertension_stage2");
  });

  it("classifica como Crise Hipertensiva quando sistólica > 180", () => {
    const result = classifyBloodPressure(185, 100);
    expect(result.category).toBe("hypertensive_crisis");
  });

  it("classifica como Crise Hipertensiva quando diastólica > 120", () => {
    const result = classifyBloodPressure(160, 125);
    expect(result.category).toBe("hypertensive_crisis");
  });

  it("retorna cor e descrição para cada categoria", () => {
    const categories = [
      classifyBloodPressure(110, 70),  // normal
      classifyBloodPressure(125, 75),  // elevated
      classifyBloodPressure(135, 85),  // stage1
      classifyBloodPressure(145, 92),  // stage2
      classifyBloodPressure(185, 125), // crisis
    ];
    categories.forEach((c) => {
      expect(c.color).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.bgColor).toBeTruthy();
    });
  });
});

describe("formatBP", () => {
  it("formata corretamente a pressão arterial", () => {
    expect(formatBP(120, 80)).toBe("120/80 mmHg");
    expect(formatBP(140, 90)).toBe("140/90 mmHg");
  });
});

// ─── Auth Router ─────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: { name: string; options: Record<string, unknown> }[] } {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Usuário Teste",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("limpa o cookie de sessão e retorna sucesso", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});
