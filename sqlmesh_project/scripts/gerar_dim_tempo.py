#!/usr/bin/env python3
"""
Gera seed CSV para dim_tempo (calendário) no período configurado.
Uso: python scripts/gerar_dim_tempo.py
"""
import csv
import datetime
from pathlib import Path

DATA_INICIO = datetime.date(2020, 1, 1)
DATA_FIM = datetime.date(2025, 12, 31)
OUTPUT = Path(__file__).parent.parent / "seeds" / "dim_tempo.csv"

FERIADOS_NACIONAIS_FIXOS = {
    (1, 1),   # Confraternização Universal
    (4, 21),  # Tiradentes
    (5, 1),   # Dia do Trabalho
    (9, 7),   # Independência
    (10, 12), # Nossa Senhora Aparecida
    (11, 2),  # Finados
    (11, 15), # Proclamação da República
    (12, 25), # Natal
}

DIAS_SEMANA_PT = [
    "Domingo", "Segunda-feira", "Terca-feira", "Quarta-feira",
    "Quinta-feira", "Sexta-feira", "Sabado"
]

MESES_PT = [
    "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]


def gera_periodo(inicio: datetime.date, fim: datetime.date):
    delta = (fim - inicio).days
    for i in range(delta + 1):
        yield inicio + datetime.timedelta(days=i)


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "data_referencia", "ano", "mes", "dia", "trimestre", "semestre",
            "dia_semana", "nome_dia_semana", "nome_mes", "ano_mes",
            "eh_final_de_semana", "eh_feriado_nacional_fixo", "eh_dia_util"
        ])
        for d in gera_periodo(DATA_INICIO, DATA_FIM):
            ano = d.year
            mes = d.month
            dia = d.day
            trimestre = (mes - 1) // 3 + 1
            semestre = 1 if mes <= 6 else 2
            dia_semana = d.weekday() + 1  # 1=Segunda ... 7=Domingo
            nome_dia = DIAS_SEMANA_PT[d.weekday()]
            nome_mes = MESES_PT[mes - 1]
            ano_mes = ano * 100 + mes
            eh_fds = dia_semana in (6, 7)
            eh_feriado = (mes, dia) in FERIADOS_NACIONAIS_FIXOS
            eh_dia_util = not eh_fds and not eh_feriado

            writer.writerow([
                d.isoformat(), ano, mes, dia, trimestre, semestre,
                dia_semana, nome_dia, nome_mes, ano_mes,
                eh_fds, eh_feriado, eh_dia_util
            ])
    print(f"✓ Seed gerado: {OUTPUT} ({(DATA_FIM - DATA_INICIO).days + 1} registros)")


if __name__ == "__main__":
    main()
