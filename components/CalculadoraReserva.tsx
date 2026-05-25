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
  Gavel,
  Clock
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
  const [prevInputMode, setPrevInputMode] = useState<'days' | 'yymmdd'>('days');
  const [prevYears, setPrevYears] = useState(0);
  const [prevMonths, setPrevMonths] = useState(0);
  const [prevDaysPart, setPrevDaysPart] = useState(0);
  const [unusedLeaves, setUnusedLeaves] = useState<number>(0);
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleDaysChange = (days: number) => {
    const safeDays = isNaN(days) || days < 0 ? 0 : days;
    setPrevDays(safeDays);
    const years = Math.floor(safeDays / 365);
    const remainingDaysAfterYears = safeDays % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const remainingDays = remainingDaysAfterYears % 30;
    setPrevYears(years);
    setPrevMonths(months);
    setPrevDaysPart(remainingDays);
  };

  const handleYymmddChange = (years: number, months: number, days: number) => {
    const safeYears = isNaN(years) || years < 0 ? 0 : years;
    const safeMonths = isNaN(months) || months < 0 ? 0 : months;
    const safeDays = isNaN(days) || days < 0 ? 0 : days;
    
    setPrevYears(safeYears);
    setPrevMonths(safeMonths);
    setPrevDaysPart(safeDays);
    const calculatedDays = (safeYears * 365) + (safeMonths * 30) + safeDays;
    setPrevDays(calculatedDays);
  };

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
      const leavesDays = unusedLeaves * 365;

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

        // 5) Final date applying averbacao and double-computed unused leaves (subtracted at the end)
        const projectionDate = addDays(grossProjectionDate, -(prevDays + leavesDays));

        // Progress Calculation
        const totalJourneyDays = (DAYS_REQUIRED_30Y + tollDays);
        const daysServedToday = differenceInDays(today, start);
        const completedJourneyDays = daysServedToday + prevDays + leavesDays;
        
        const progressPercent = Math.min(
          100,
          Math.max(0, Math.floor((completedJourneyDays / totalJourneyDays) * 100))
        );

        // Current service time string (including averbacao and leaves benefits)
        const currentServiceString = formatAdminDuration(daysServedToday + prevDays + leavesDays);
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
          averbaçãoDias: prevDays,
          unusedLeaves,
          leavesDays
        });

      } else {
        // PERMANENT RULE (35 years = 12.775 days)
        const grossProjectionDate = addDays(start, DAYS_REQUIRED_35Y);
        const projectionDate = addDays(grossProjectionDate, -(prevDays + leavesDays));

        const daysServedToday = differenceInDays(today, start);
        const completedJourneyDays = daysServedToday + prevDays + leavesDays;
        
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
          averbaçãoDias: prevDays,
          unusedLeaves,
          leavesDays
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

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider">Tempo Anterior (Averbado)</label>
                    <div className="flex bg-[#121416] p-0.5 rounded-lg border border-white/5">
                      <button
                        type="button"
                        onClick={() => setPrevInputMode('days')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all select-none ${
                          prevInputMode === 'days'
                            ? 'bg-secondary text-[#412d00]'
                            : 'text-[#c4c6d0] hover:text-white'
                        }`}
                      >
                        Dias
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrevInputMode('yymmdd')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all select-none ${
                          prevInputMode === 'yymmdd'
                            ? 'bg-secondary text-[#412d00]'
                            : 'text-[#c4c6d0] hover:text-white'
                        }`}
                      >
                        A / M / D
                      </button>
                    </div>
                  </div>

                  {prevInputMode === 'days' ? (
                    <div className="relative">
                      <input 
                        type="number" 
                        value={prevDays || ''}
                        onChange={(e) => handleDaysChange(Number(e.target.value))}
                        placeholder="Ex: 1237"
                        className="w-full bg-[#191c1e] border border-[#43474e] rounded-xl h-14 px-4 focus:ring-2 focus:ring-secondary outline-none text-white transition-all pr-16 text-lg"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c4c6d0] text-xs font-bold">DIAS</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="relative">
                          <input 
                            type="number" 
                            value={prevYears || ''}
                            onChange={(e) => handleYymmddChange(Number(e.target.value), prevMonths, prevDaysPart)}
                            placeholder="Anos"
                            className="w-full bg-[#191c1e] border border-[#43474e] rounded-xl h-14 px-3 focus:ring-2 focus:ring-secondary outline-none text-white transition-all text-center text-lg pb-4"
                          />
                          <span className="absolute bottom-1 left-0 right-0 text-[8px] text-[#c4c6d0]/40 font-bold uppercase tracking-wider text-center pointer-events-none">Anos</span>
                        </div>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={prevMonths || ''}
                            onChange={(e) => handleYymmddChange(prevYears, Number(e.target.value), prevDaysPart)}
                            placeholder="Meses"
                            className="w-full bg-[#191c1e] border border-[#43474e] rounded-xl h-14 px-3 focus:ring-2 focus:ring-secondary outline-none text-white transition-all text-center text-lg pb-4"
                          />
                          <span className="absolute bottom-1 left-0 right-0 text-[8px] text-[#c4c6d0]/40 font-bold uppercase tracking-wider text-center pointer-events-none">Meses</span>
                        </div>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={prevDaysPart || ''}
                            onChange={(e) => handleYymmddChange(prevYears, prevMonths, Number(e.target.value))}
                            placeholder="Dias"
                            className="w-full bg-[#191c1e] border border-[#43474e] rounded-xl h-14 px-3 focus:ring-2 focus:ring-secondary outline-none text-white transition-all text-center text-lg pb-4"
                          />
                          <span className="absolute bottom-1 left-0 right-0 text-[8px] text-[#c4c6d0]/40 font-bold uppercase tracking-wider text-center pointer-events-none">Dias</span>
                        </div>
                      </div>
                      {prevDays > 0 && (
                        <p className="text-[10px] text-[#adc7f8]/80 font-semibold uppercase tracking-wider ml-1">
                          → Equivalente a {prevDays} dias averbados
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider block">Licenças Não Gozadas (máx. 2)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setUnusedLeaves(num)}
                        className={`h-14 rounded-xl border font-bold text-lg transition-all ${
                          unusedLeaves === num
                            ? 'bg-secondary text-[#412d00] border-secondary'
                            : 'bg-[#191c1e] border-[#43474e] text-white hover:border-[#adc7f8]/50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#c4c6d0]/60 uppercase ml-1">
                    {unusedLeaves === 0 && 'Nenhuma licença especial computada'}
                    {unusedLeaves === 1 && 'Computa +1 ano de tempo de serviço (+365 dias)'}
                    {unusedLeaves === 2 && 'Computa +2 anos de tempo de serviço (+730 dias)'}
                  </p>
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

                {/* Sub-grid: Progress and Detailed Timeline Side-by-Side */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Progress Card (lg:col-span-5) */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    <motion.section variants={itemVariants} className="glass-panel rounded-2xl p-8 flex flex-col items-center gap-6">
                      <h3 className="text-xs font-bold text-secondary uppercase tracking-widest text-center w-full">Progresso Geral</h3>
                      <div className="relative flex items-center justify-center">
                        <div className="progress-circle flex items-center justify-center" style={{ '--percent': results?.progressPercent || 0 } as any}>
                          <div className="bg-[#1d2022] w-[104px] h-[104px] rounded-full flex flex-col items-center justify-center border border-white/5">
                            <span className="text-3xl font-bold text-white font-mono">{results?.progressPercent}%</span>
                            <span className="text-[10px] text-[#c4c6d0] uppercase font-bold tracking-wider">Cumpridos</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full space-y-4">
                        <div className="flex justify-between items-center text-sm font-bold text-[#c4c6d0]">
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#adc7f8]" /> Efetuado</span>
                          <span className="text-white text-[10px] font-mono">{results?.currentServiceString}</span>
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
                          <span className="flex items-center gap-1.5"><Hourglass className="w-3.5 h-3.5 text-secondary" /> Restante</span>
                          <span className="text-secondary text-[10px] font-mono">{results?.remainingString}</span>
                        </div>
                      </div>
                    </motion.section>

                    {/* Legal Badge Card */}
                    <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 border-l-4 border-secondary/50 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#604403]/20 flex items-center justify-center border border-secondary/20 flex-shrink-0">
                        <Gavel className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">
                          {results.isTransition ? 'Modelo de Transição LCE 692/21' : 'Regramento Padrão'}
                        </div>
                        <p className="text-[11px] text-[#c4c6d0]/80 leading-relaxed mt-1">
                          {results.isTransition 
                            ? 'Aplica pedágio de 17% exclusivamente sobre o período faltante apurado em 31/12/2021.' 
                            : 'Exige o cumprimento padrão de 35 anos diretos de efetivo serviço para militares sem direito à transição.'}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Right Column: Calculations and Milestones Timeline (lg:col-span-7) */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    <motion.section variants={itemVariants} className="glass-panel rounded-2xl p-8 border border-white/5">
                      <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                        <span className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                          <History className="w-4 h-4" /> Linha do Tempo & Memória
                        </span>
                        <span className="text-[9px] font-mono bg-[#1d2022] border border-white/10 text-white px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">
                          {results.totalRequirement}
                        </span>
                      </div>

                      {/* Timeline flow */}
                      <div className="relative border-l border-white/10 pl-6 ml-3 space-y-8">
                        
                        {/* Milestone 1: Military entrance */}
                        <div className="relative">
                          {/* Indicator dot */}
                          <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[#121416] border-2 border-secondary shadow-[0_0_8px_rgba(233,193,118,0.5)]" />
                          
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ingresso Militar</h4>
                              <span className="text-[10px] font-mono font-bold bg-[#1d2022] px-2 py-0.5 rounded text-white border border-white/5">
                                {format(new Date(`${ingresDate}T12:00:00`), "dd/MM/yyyy")}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#c4c6d0]/70 leading-relaxed">
                              Início do tempo de serviço administrativo na Corporação.
                            </p>
                          </div>
                        </div>

                        {results.isTransition ? (
                          <>
                            {/* Milestone 2: Service at Transition Date */}
                            <div className="relative">
                              <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[#121416] border-2 border-[#adc7f8] shadow-[0_0_8px_rgba(173,199,248,0.5)]" />
                              
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tempo em data limite (31/12/21)</h4>
                                  <span className="text-[10px] font-mono font-bold bg-[#121416] px-2 py-0.5 rounded text-[#adc7f8] border border-white/5">
                                    {results.serviceAtTransition}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#c4c6d0]/70 leading-relaxed">
                                  Base legal avaliada no momento da introdução da Lei Complementar Estadual.
                                </p>
                              </div>
                            </div>

                            {/* Milestone 3: Toll calculation */}
                            <div className="relative">
                              <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[#121416] border-2 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                              
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Pedágio Estimado (17%)</h4>
                                  <span className="text-[10px] font-mono font-bold bg-[#1d2022] px-2 py-0.5 rounded text-amber-400 border border-white/5">
                                    +{results.tollString}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#c4c6d0]/70 leading-relaxed">
                                  Acrescido por lei com base nos dias faltantes para cumprir o requisito anterior (faltavam {results.missingTo30}).
                                </p>
                              </div>
                            </div>
                          </>
                        ) : (
                          /* Milestone 2 for permanent rule */
                          <div className="relative">
                            <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[#121416] border-2 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Requisito Permanente</h4>
                                <span className="text-[10px] font-mono font-bold bg-[#1d2022] px-2 py-0.5 rounded text-amber-400 border border-white/5">
                                  35 anos (12.775 dias)
                                </span>
                              </div>
                              <p className="text-[11px] text-[#c4c6d0]/70 leading-relaxed">
                                Total legal para militares que ingressaram após 31/12/2021.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Milestone 4: Deductions (Averbacoes/Licencas) */}
                        {(results.averbaçãoDias > 0 || results.unusedLeaves > 0) && (
                          <div className="relative">
                            <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[#121416] border-2 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Redutores (Benefícios)</h4>
                                <span className="text-[10px] font-mono font-bold bg-emerald-950/25 border border-emerald-500/10 px-2 py-0.5 rounded text-emerald-400">
                                  -{formatAdminDuration(results.averbaçãoDias + results.leavesDays)}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#c4c6d0]/70 leading-relaxed mb-3">
                                Redução direta aplicada ao final da meta bruta por compensações concedidas:
                              </p>
                              
                              <div className="flex flex-col gap-2">
                                {results.averbaçãoDias > 0 && (
                                  <div className="flex justify-between items-center text-[10px] font-bold bg-[#121416]/50 rounded-xl px-4 py-2 border border-white/5">
                                    <span className="text-[#c4c6d0] uppercase tracking-wider">Tempo Averbedo Anterior</span>
                                    <span className="text-secondary font-mono">+{results.averbaçãoDias} dias</span>
                                  </div>
                                )}
                                {results.unusedLeaves > 0 && (
                                  <div className="flex justify-between items-center text-[10px] font-bold bg-[#121416]/50 rounded-xl px-4 py-2 border border-white/5">
                                    <span className="text-[#c4c6d0] uppercase tracking-wider">Licenças em Dobro ({results.unusedLeaves})</span>
                                    <span className="text-secondary font-mono">+{results.leavesDays} dias (+{results.unusedLeaves} {results.unusedLeaves === 1 ? 'ano' : 'anos'})</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Milestone 5: Total final */}
                        <div className="relative">
                          <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[#121416] border-2 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                          
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tempo Total Computado</h4>
                              <span className="text-[10px] font-mono font-bold bg-[#1d2022] px-2 py-0.5 rounded text-cyan-400 border border-white/5">
                                {results.currentServiceString}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#c4c6d0]/70 leading-relaxed">
                              Jornada ativa real aferida de serviço somando os abonos computados.
                            </p>
                          </div>
                        </div>

                      </div>
                    </motion.section>
                  </div>

                </div>
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