'use client';

import React, { useState } from 'react';
import { 
  Shield, 
  History, 
  Calendar as CalendarIcon, 
  Calculator, 
  Info, 
  Verified, 
  Hourglass, 
  Gavel
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  differenceInDays, 
  addDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Constants for LCE 692/2021 (PMRN) - Strict Administrative Days
const TRANSITION_DATE = new Date(2021, 11, 31); // Dec 31, 2021
const DAYS_REQUIRED_30Y = 30 * 365; // 10.950 days
const DAYS_REQUIRED_35Y = 35 * 365; // 12.775 days
const TOLL_PERCENTAGE = 0.17;

export default function CalculadoraReserva() {
  const [ingresDate, setIngresDate] = useState('2010-02-24');
  const [prevDays, setPrevDays] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Helper function to format days strictly by administrative standard (365/30)
  const formatAdminDuration = (totalDays: number) => {
    if (totalDays <= 0) return '0 dias';
    
    const years = Math.floor(totalDays / 365);
    const remainingDaysAfterYears = totalDays % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const days = remainingDaysAfterYears % 30;

    const parts = [];
    if (years) parts.push(`${years} ano${years > 1 ? 's' : ''}`);
    if (months) parts.push(`${months} ${months > 1 ? 'meses' : 'mês'}`);
    if (days || parts.length === 0) parts.push(`${days} dia${days > 1 ? 's' : ''}`);
    
    if (parts.length === 1) return parts[0];
    const last = parts.pop();
    return `${parts.join(', ')} e ${last}`;
  };

  const calculateProjection = () => {
    setIsCalculating(true);

    setTimeout(() => {
      // Timezone safe date parsing
      const start = new Date(`${ingresDate}T12:00:00`);
      const today = new Date();
      today.setHours(12, 0, 0, 0);

      const isTransition = start <= TRANSITION_DATE;

      if (isTransition) {
        // 1) Calculate exact days served until 31/12/2021
        const daysServedAtTransition = Math.max(0, differenceInDays(TRANSITION_DATE, start));
        const serviceAtTransition = formatAdminDuration(daysServedAtTransition);

        // 2) Calculate missing days to reach the 30-year mark (10.950 days)
        const missingDays = Math.max(0, DAYS_REQUIRED_30Y - daysServedAtTransition);
        const missingTo30 = formatAdminDuration(missingDays);

        // 3) Calculate 17% toll over the missing days
        const tollDays = Math.round(missingDays * TOLL_PERCENTAGE);
        const tollString = formatAdminDuration(tollDays);

        // 4) Gross retirement date (Start + 30 years in days + toll days)
        const grossProjectionDate = addDays(start, DAYS_REQUIRED_30Y + tollDays);

        // 5) Final date applying averbacao (subtracted at the end)
        const projectionDate = addDays(grossProjectionDate, -prevDays);

        // Progress Calculation
        const totalJourneyDays = (DAYS_REQUIRED_30Y + tollDays);
        const daysServedToday = differenceInDays(today, start);
        const completedJourneyDays = daysServedToday + prevDays;
        
        const progressPercent = Math.min(
          100,
          Math.max(0, Math.floor((completedJourneyDays / totalJourneyDays) * 100))
        );

        // Current service time string (including averbacao)
        const currentServiceString = formatAdminDuration(daysServedToday + prevDays);
        const remainingString = today >= projectionDate ? "Requisitos Cumpridos" : formatAdminDuration(differenceInDays(projectionDate, today));

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
        // PERMANENT RULE (35 years = 12.775 days)
        const grossProjectionDate = addDays(start, DAYS_REQUIRED_35Y);
        const projectionDate = addDays(grossProjectionDate, -prevDays);

        const daysServedToday = differenceInDays(today, start);
        const completedJourneyDays = daysServedToday + prevDays;
        
        const progressPercent = Math.min(
          100,
          Math.max(0, Math.floor((completedJourneyDays / DAYS_REQUIRED_35Y) * 100))
        );

        const currentServiceString = formatAdminDuration(completedJourneyDays);
        const remainingString = today >= projectionDate ? "Requisitos Cumpridos" : formatAdminDuration(differenceInDays(projectionDate, today));

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

      if (window.innerWidth < 768) {
        setTimeout(() => {
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }, 100);
      }
    }, 800);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <main className={`pt-12 pb-32 px-4 md:px-16 mx-auto w-full transition-all duration-700 ${showResults ? 'max-w-7xl' : 'max-w-3xl flex flex-col items-center text-center pt-24 md:pt-32'}`}>
        
        {/* Landing Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-12 ${showResults ? '' : 'flex flex-col items-center'}`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#604403]/20 border border-secondary/20 text-secondary text-[10px] font-bold uppercase tracking-widest mb-6">
            <Verified className="w-3 h-3" />
            Simulador LCE 692/2021 (RN)
          </div>
          <h1 className={`${showResults ? 'text-4xl md:text-5xl' : 'text-5xl md:text-7xl'} font-bold text-white mb-4 tracking-tight`}>
            Calculadora de Reserva Militar
          </h1>
          <p className={`text-[#c4c6d0] text-lg max-w-2xl leading-relaxed ${showResults ? '' : 'text-center'}`}>
            Planeje sua transição com precisão. Insira seus dados abaixo para obter a projeção detalhada da sua reserva remunerada na Polícia Militar.
          </p>
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
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-3">
                      <div className="w-6 h-6 border-4 border-[#412d00]/30 border-t-[#412d00] rounded-full animate-spin" />
                      Processando Dados...
                    </motion.div>
                  ) : (
                    <>
                      <Calculator className="w-6 h-6" />
                      Calcular Reserva
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
                    Transição LCE 692/21
                  </h3>
                  <p className="text-sm text-[#c4c6d0] leading-relaxed">
                    Nossa ferramenta utiliza os parâmetros da Lei Complementar Estadual 692/21, aplicando o pedágio de 17% sobre o tempo faltante em 31/12/2021.
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
                        {results.isTransition ? 'Regra de Transição LCE 692/21' : 'Regra Permanente LCE 692/21'}
                      </span>
                    </div>
                    <div className="hidden md:block w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2 text-secondary">
                      <Info className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {results.isTransition ? 'Data Marco: 31/12/2021' : 'Ingresso Pós-Vigência'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Sub-grid */}
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
                        <span>Tempo de Serviço</span>
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
                            <span className="text-[10px] font-bold text-[#c4c6d0] uppercase tracking-wider">Tempo em 31/12/2021</span>
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
                          Como você ingressou após 31/12/2021, sua reserva requer 35 anos (12.775 dias) de serviço militar direto, sem regra de transição ou pedágio.
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
                    <span className="text-[10px] font-bold text-[#c4c6d0]/60 uppercase tracking-wider block mb-1">Tempo Total Computado</span>
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
                        {results.isTransition ? 'LCE 692/2021 (RN)' : 'Regramento Pós-LCE'}
                      </div>
                      <div className="text-[#c4c6d0] text-sm leading-relaxed">
                        {results.isTransition 
                          ? 'Cálculo baseado na Lei Complementar 692/21 (RN), aplicando pedágio de 17% sobre o tempo faltante em 31/12/2021.' 
                          : 'Cálculo direto de 35 anos de serviço para ingressos após a vigência da lei estadual.'}
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

      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

      <footer className="w-full py-6 px-4 md:px-16 border-t border-white/5 flex justify-center items-center mt-auto">
        <p className="text-[#c4c6d0]/40 text-[10px] font-bold uppercase tracking-[0.2em]">
          Desenvolvido pelo Sgt PM Vanderson - 6º BPM
        </p>
      </footer>
    </div>
  );
}