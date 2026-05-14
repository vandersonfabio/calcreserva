'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  History, 
  HelpCircle, 
  Calendar as CalendarIcon, 
  ArrowRight, 
  Calculator, 
  Info, 
  Verified, 
  BarChart3, 
  Hourglass, 
  Clock, 
  MoreVertical,
  LayoutGrid,
  Menu,
  Gavel
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  differenceInDays, 
  addDays, 
  addYears, 
  addMonths, 
  parseISO, 
  differenceInMonths,
  differenceInYears,
  intervalToDuration
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Constants for Law 13.954/19
const TRANSITION_DATE = new Date(2019, 11, 17); // Dec 17, 2019
const OLD_REQUIREMENT_YEARS = 30;
const NEW_REQUIREMENT_YEARS = 35;
const TOLL_PERCENTAGE = 0.17;

export default function CalculadoraReserva() {
  const [ingresDate, setIngresDate] = useState('2010-02-24');
  const [prevDays, setPrevDays] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const formatDuration = (start: Date, end: Date) => {
    const duration = intervalToDuration({ start, end });
    const parts = [];
    if (duration.years) parts.push(`${duration.years} ano${duration.years > 1 ? 's' : ''}`);
    if (duration.months) parts.push(`${duration.months} ${duration.months > 1 ? 'meses' : 'mês'}`);
    if (duration.days) parts.push(`${duration.days} dia${duration.days > 1 ? 's' : ''}`);
    
    if (parts.length === 0) return '0 dias';
    if (parts.length === 1) return parts[0];
    const last = parts.pop();
    return `${parts.join(', ')} e ${last}`;
  };

  const calculateProjection = () => {
    setIsCalculating(true);

    setTimeout(() => {

      // =========================================================
      // NORMALIZAÇÃO DE DATA
      // Evita bugs de timezone
      // =========================================================
      const start = new Date(`${ingresDate}T12:00:00`);

      const today = new Date();

      // =========================================================
      // REGRA DE TRANSIÇÃO
      // IMPORTANTE:
      // A averbação NÃO altera:
      // - ingresso militar
      // - pedágio
      // - tempo em 2019
      //
      // Ela apenas reduz a data final.
      // =========================================================
      const isTransition = start <= TRANSITION_DATE;

      // =========================================================
      // FORMATADOR PADRONIZADO
      // =========================================================
      const formatDurationSafe = (startDate: Date, endDate: Date) => {

        const duration = intervalToDuration({
          start: startDate,
          end: endDate
        });

        return (
          `${duration.years || 0} ano${(duration.years || 0) !== 1 ? 's' : ''}, ` +
          `${duration.months || 0} ${((duration.months || 0) !== 1) ? 'meses' : 'mês'} e ` +
          `${duration.days || 0} dia${((duration.days || 0) !== 1 ? 's' : '')}`
        );
      };

      // =========================================================
      // REGRA DE TRANSIÇÃO
      // =========================================================
      if (isTransition) {

        // -------------------------------------------------------
        // TEMPO EXISTENTE EM 17/12/2019
        // -------------------------------------------------------
        const serviceAtTransition = formatDurationSafe(
          start,
          TRANSITION_DATE
        );

        // -------------------------------------------------------
        // DATA EM QUE COMPLETARIA 30 ANOS
        // -------------------------------------------------------
        const targetDate30y = addYears(
          start,
          OLD_REQUIREMENT_YEARS
        );

        // -------------------------------------------------------
        // TEMPO FALTANTE EM 17/12/2019
        // -------------------------------------------------------
        const missingDays = Math.max(
          0,
          differenceInDays(
            targetDate30y,
            TRANSITION_DATE
          )
        );

        const missingTo30 = formatDurationSafe(
          TRANSITION_DATE,
          targetDate30y
        );

        // -------------------------------------------------------
        // PEDÁGIO 17%
        // -------------------------------------------------------
        const tollDays = Math.round(
          missingDays * TOLL_PERCENTAGE
        );

        // -------------------------------------------------------
        // DATA BRUTA
        // (30 anos + pedágio)
        // -------------------------------------------------------
        const grossProjectionDate = addDays(
          targetDate30y,
          tollDays
        );

        // -------------------------------------------------------
        // DATA FINAL
        // Averbação desconta apenas no final
        // -------------------------------------------------------
        const projectionDate = addDays(
          grossProjectionDate,
          -prevDays
        );

        // -------------------------------------------------------
        // FORMATAÇÃO DO PEDÁGIO
        // -------------------------------------------------------
        const tollEndDate = addDays(
          new Date(2000, 0, 1),
          tollDays
        );

        const tollDuration = intervalToDuration({
          start: new Date(2000, 0, 1),
          end: tollEndDate
        });

        const tollString =
          `${tollDuration.years || 0} anos, ` +
          `${tollDuration.months || 0} meses e ` +
          `${tollDuration.days || 0} dias`;

        // -------------------------------------------------------
        // TEMPO ATUAL MILITAR
        // (SEM averbação)
        // -------------------------------------------------------
        const currentServiceString = formatDurationSafe(
          start,
          today
        );

        // -------------------------------------------------------
        // TEMPO RESTANTE
        // -------------------------------------------------------
        const remainingString = formatDurationSafe(
          today,
          projectionDate
        );

        // -------------------------------------------------------
        // PROGRESSO
        // -------------------------------------------------------
        const totalJourneyDays = differenceInDays(
          grossProjectionDate,
          start
        );

        const completedJourneyDays = differenceInDays(
          today,
          start
        ) + prevDays;

        const progressPercent = Math.min(
          100,
          Math.max(
            0,
            Math.floor(
              (completedJourneyDays / totalJourneyDays) * 100
            )
          )
        );

        // -------------------------------------------------------
        // RESULTADOS
        // -------------------------------------------------------
        setResults({
          isTransition: true,

          projectionDate,

          grossProjectionDate,

          serviceAtTransition,

          missingTo30,

          tollString,

          currentServiceString,

          remainingString,

          totalRequirement: "30 anos + pedágio 17%",

          progressPercent,

          averbaçãoDias: prevDays
        });

      } else {

        // =======================================================
        // REGRA PERMANENTE
        // =======================================================

        // -------------------------------------------------------
        // DATA BRUTA
        // -------------------------------------------------------
        const grossProjectionDate = addYears(
          start,
          NEW_REQUIREMENT_YEARS
        );

        // -------------------------------------------------------
        // DATA FINAL
        // -------------------------------------------------------
        const projectionDate = addDays(
          grossProjectionDate,
          -prevDays
        );

        // -------------------------------------------------------
        // TEMPO ATUAL
        // -------------------------------------------------------
        const currentServiceString = formatDurationSafe(
          start,
          today
        );

        // -------------------------------------------------------
        // TEMPO RESTANTE
        // -------------------------------------------------------
        const remainingString = formatDurationSafe(
          today,
          projectionDate
        );

        // -------------------------------------------------------
        // PROGRESSO
        // -------------------------------------------------------
        const totalJourneyDays = differenceInDays(
          grossProjectionDate,
          start
        );

        const completedJourneyDays = differenceInDays(
          today,
          start
        ) + prevDays;

        const progressPercent = Math.min(
          100,
          Math.max(
            0,
            Math.floor(
              (completedJourneyDays / totalJourneyDays) * 100
            )
          )
        );

        // -------------------------------------------------------
        // RESULTADOS
        // -------------------------------------------------------
        setResults({
          isTransition: false,

          projectionDate,

          grossProjectionDate,

          currentServiceString,

          remainingString,

          totalRequirement: "35 anos (Regra Permanente)",

          progressPercent,

          averbaçãoDias: prevDays
        });
      }

      setIsCalculating(false);

      setShowResults(true);

      // =========================================================
      // SCROLL MOBILE
      // =========================================================
      if (window.innerWidth < 768) {

        setTimeout(() => {

          window.scrollTo({
            top: 400,
            behavior: 'smooth'
          });

        }, 100);
      }

    }, 800);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <main className={`pt-8 pb-32 px-4 md:px-16 mx-auto w-full transition-all duration-700 ${showResults ? 'max-w-7xl' : 'max-w-3xl flex flex-col items-center text-center pt-32 md:pt-48'}`}>
        {/* Landing Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-12 ${showResults ? '' : 'flex flex-col items-center'}`}
        >
          <motion.div 
            layout
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#604403]/20 border border-secondary/20 text-secondary text-[10px] font-bold uppercase tracking-widest mb-6"
          >
            <Verified className="w-3 h-3" />
            Simulador Lei 13.954/19
          </motion.div>
          <motion.h1 layout className={`${showResults ? 'text-4xl md:text-5xl' : 'text-5xl md:text-7xl'} font-bold text-white mb-4 tracking-tight`}>
            Calculadora de Reserva Militar
          </motion.h1>
          <motion.p layout className={`text-[#c4c6d0] text-lg max-w-2xl leading-relaxed ${showResults ? '' : 'text-center'}`}>
            Planeje sua transição com precisão. Insira seus dados abaixo para obter a projeção detalhada da sua reserva remunerada na Polícia Militar.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
          {/* Inputs Column */}
          <motion.div 
            layout
            className={`${showResults ? 'md:col-span-4' : 'md:col-start-4 md:col-span-6'} space-y-6 w-full`}
          >
            <section className="glass-panel rounded-2xl p-8 shadow-2xl border border-white/5 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-8">
                <CalendarIcon className="w-6 h-6 text-secondary" />
                <h2 className="text-2xl font-bold text-white">Seus Dados</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider">Data de Ingresso</label>
                  <input 
                    type="date" 
                    value={ingresDate}
                    onChange={(e) => setIngresDate(e.target.value)}
                    className="w-full bg-[#191c1e] border border-[#43474e] rounded-xl h-14 px-4 focus:ring-2 focus:ring-secondary outline-none text-white transition-all text-lg"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider">Tempo Anterior (Averbado)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={prevDays}
                      onChange={(e) => setPrevDays(Number(e.target.value))}
                      placeholder="Total em dias"
                      className="w-full bg-[#191c1e] border border-[#43474e] rounded-xl h-14 px-4 focus:ring-2 focus:ring-secondary outline-none text-white transition-all pr-16 text-lg"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c4c6d0] text-xs font-bold">DIAS</span>
                  </div>
                </div>

                <button 
                  onClick={calculateProjection}
                  disabled={isCalculating}
                  className="w-full h-16 bg-secondary text-[#412d00] text-xl font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-[#ffdea5] transition-all hover:shadow-[0_0_20px_rgba(233,193,118,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCalculating ? (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-6 h-6 border-4 border-[#412d00]/30 border-t-[#412d00] rounded-full animate-spin" />
                      Processando Dados...
                    </motion.div>
                  ) : (
                    <>
                      <Calculator className="w-6 h-6" />
                      Calcular
                    </>
                  )}
                </button>
              </div>
            </section>

            <AnimatePresence>
              {!showResults && (
                <motion.section 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-panel rounded-2xl p-6 border-l-4 border-[#adc7f8]"
                >
                  <h3 className="text-lg font-bold text-[#adc7f8] mb-2 flex items-center gap-2">
                    <Gavel className="w-5 h-5" />
                    Critérios de Transição
                  </h3>
                  <p className="text-sm text-[#c4c6d0] leading-relaxed">
                    Nossa ferramenta utiliza os parâmetros oficiais do Art. 26 da Lei 13.954/19, aplicando automaticamente o pedágio de 17% e o novo tempo mínimo de serviço de 35 anos.
                  </p>
                </motion.section>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Results Column */}
          <AnimatePresence>
            {showResults && results && (
              <motion.div 
                key="results-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="md:col-span-8 flex flex-col gap-8"
              >
                {/* Main Result Card */}
                <motion.div 
                  variants={itemVariants}
                  className="glass-panel rounded-2xl p-8 gold-border-gradient flex flex-col justify-between h-auto md:h-64 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Shield className="w-48 h-48 text-secondary" />
                  </div>
                  
                  <div className="relative z-10">
                    <span className="text-sm font-bold text-secondary uppercase tracking-wider">Aposentadoria Estimada para</span>
                    <div className="text-6xl md:text-8xl font-bold text-white tracking-tighter uppercase mt-2 drop-shadow-lg">
                      {format(results.projectionDate, "dd MMM yyyy", { locale: ptBR })}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-6 mt-8 pt-6 border-t border-white/5 relative z-10">
                    <div className="flex items-center gap-2 text-[#c4c6d0]">
                      <Verified className="w-4 h-4 text-[#adc7f8]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {results.isTransition ? 'Regra de Transição Lei 13.954' : 'Regra Permanente Lei 13.954'}
                      </span>
                    </div>
                    <div className="hidden md:block w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2 text-secondary">
                      <Info className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {results.isTransition ? 'Base Legal: Art. 26' : 'Ingresso Pós-Vigência'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Sub-grid with staggering */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Progress View */}
                  <motion.section variants={itemVariants} className="glass-panel rounded-2xl p-8 flex flex-col items-center gap-6">
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-widest text-center w-full">Progresso Geral</h3>
                    <div className="relative flex items-center justify-center">
                      <div className="progress-circle flex items-center justify-center" style={{ '--percent': results?.progressPercent || 0 } as any}>
                        <div className="bg-[#1d2022] w-[104px] h-[104px] rounded-full flex flex-col items-center justify-center border border-white/5">
                          <span className="text-3xl font-bold text-white">{results?.progressPercent}%</span>
                          <span className="text-[10px] text-[#c4c6d0] uppercase font-bold">Cumpridos</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full space-y-4">
                      <div className="flex justify-between items-center text-sm font-bold text-[#c4c6d0]">
                        <span>Serviço Militar</span>
                        <span className="text-white text-[10px]">{results?.currentServiceString}</span>
                      </div>
                      <div className="w-full bg-[#323537] h-3 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${results?.progressPercent}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="bg-gradient-to-r from-secondary to-[#ffdea5] h-full rounded-full shadow-[0_0_10px_rgba(233,193,118,0.4)]"
                        />
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-[#c4c6d0]">
                        <span>Tempo Restante</span>
                        <span className="text-secondary text-[10px]">{results?.remainingString}</span>
                      </div>
                    </div>
                  </motion.section>

                  {/* Service Breakdown */}
                  <div className="grid grid-cols-1 gap-6">
                    {results.isTransition ? (
                      <>
                        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 border-t-2 border-[#adc7f8]/30">
                          <div className="flex items-center gap-3 mb-3">
                            <History className="w-5 h-5 text-[#adc7f8]" />
                            <span className="text-[10px] font-bold text-[#c4c6d0] uppercase tracking-wider">Tempo em 17/12/2019</span>
                          </div>
                          <div className="text-2xl font-bold text-white tracking-tight">{results.serviceAtTransition}</div>
                          <p className="text-[10px] text-[#c4c6d0]/60 uppercase mt-4">Base oficial para transição</p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 border-t-2 border-secondary/30">
                          <div className="flex items-center gap-3 mb-3">
                            <Hourglass className="w-5 h-5 text-secondary" />
                            <span className="text-[10px] font-bold text-[#c4c6d0] uppercase tracking-wider">Faltante para 30 anos</span>
                          </div>
                          <div className="text-2xl font-bold text-white tracking-tight">{results.missingTo30}</div>
                          <p className="text-[10px] text-[#c4c6d0]/60 uppercase mt-4">Tempo remanescente na data marco</p>
                        </motion.div>
                      </>
                    ) : (
                      <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-8 border-l-4 border-secondary/50 flex flex-col justify-center h-full">
                        <div className="flex items-center gap-3 mb-4">
                          <Shield className="w-6 h-6 text-secondary" />
                          <span className="text-sm font-bold text-[#c4c6d0] uppercase tracking-widest">Regra Permanente</span>
                        </div>
                        <p className="text-white text-lg leading-relaxed">
                          Como você ingressou após 17/12/2019, sua reserva requer 35 anos de serviço militar direto, sem regra de transição ou pedágio.
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Technical Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div variants={itemVariants} className="glass-panel rounded-xl p-6 border-b border-white/5">
                    <span className="text-[10px] font-bold text-[#c4c6d0]/60 uppercase tracking-wider block mb-1">Requisito Total</span>
                    <div className="text-xl font-bold text-white tracking-tight">{results.totalRequirement}</div>
                  </motion.div>
                  
                  {results.isTransition && (
                    <motion.div variants={itemVariants} className="glass-panel rounded-xl p-6 border-b border-white/5">
                      <span className="text-[10px] font-bold text-[#c4c6d0]/60 uppercase tracking-wider block mb-1">Pedágio (17%)</span>
                      <div className="text-xl font-bold text-secondary tracking-tight">{results.tollString}</div>
                    </motion.div>
                  )}

                  <motion.div variants={itemVariants} className={`glass-panel rounded-xl p-6 border-b border-white/5 ${!results.isTransition ? 'md:col-span-2' : ''}`}>
                    <span className="text-[10px] font-bold text-[#c4c6d0]/60 uppercase tracking-wider block mb-1">Cálculo Atual Militar</span>
                    <div className="text-xl font-bold text-[#adc7f8] tracking-tight">{results.currentServiceString}</div>
                  </motion.div>
                </div>

                <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-[#604403]/20 flex items-center justify-center border border-secondary/20 rotate-3">
                      <Gavel className="w-8 h-8 text-secondary" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-xl">
                        {results.isTransition ? 'Análise da Lei 13.954/2019' : 'Regramento Pós-Lei'}
                      </div>
                      <div className="text-[#c4c6d0] text-sm leading-relaxed">
                        {results.isTransition 
                          ? 'Cálculo baseado no Artigo 26 da Lei 13.954/19, aplicando pedágio sobre o tempo faltante.' 
                          : 'Cálculo direto de 35 anos de serviço para ingressos após a vigência da nova lei.'}
                      </div>
                    </div>
                  </div>
                  <div className="bg-secondary/10 border border-secondary/20 px-8 py-3 rounded-full">
                    <span className="text-secondary text-sm font-bold uppercase tracking-widest">
                      {results.isTransition ? 'Transição' : 'Permanente'}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 mt-auto border-t border-white/5 flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
          <Shield className="w-4 h-4 text-[#adc7f8]" />
          <span className="text-[10px] font-bold text-[#adc7f8] uppercase tracking-[0.2em]">6º Batalhão de Polícia Militar</span>
        </div>
        <p className="text-[10px] text-[#c4c6d0]/40 font-medium">Desenvolvido pelo Sgt PM Vanderson - 6º BPM</p>
      </footer>

      {/* Decorative Overlays */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]" 
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }}
      ></div>
    </div>
  );
}
