import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { NoArvore } from '../../api/visao'

interface Props {
  data: NoArvore
  onLeafClick: (node: NoArvore) => void
}

// Paleta por profundidade
const DEPTH_FILL = [
  '#002B38',  // depth 0 — empresa (bg do círculo raiz)
  '#0F4C5C',  // depth 1 — clientes
  '#1A6478',  // depth 2 — obras
  '#2A7A94',  // depth 3 — campanhas
]

const DEPTH_FILL_HOVER = [
  '#003B4E',
  '#1A6070',
  '#226888',
  '#3490AC',
]

function depthColor(depth: number, hover = false): string {
  const arr = hover ? DEPTH_FILL_HOVER : DEPTH_FILL
  return arr[Math.min(depth, arr.length - 1)]
}

// Trunca nome para caber dentro da bolha
function truncate(name: string, maxChars: number): string {
  if (name.length <= maxChars) return name
  return name.slice(0, Math.max(4, maxChars - 1)) + '…'
}

export function ZoomableCirclePacking({ data, onLeafClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const el = svgRef.current
    if (!el || !data) return

    const W = el.clientWidth || window.innerWidth
    const H = el.clientHeight || window.innerHeight
    if (!W || !H) return

    const svg = d3.select(el)
    svg.selectAll('*').remove()

    // ── 1. Hierarquia + pack ───────────────────────────────
    const hier = d3.hierarchy<NoArvore>(data as any)
      .sum((d: any) => Math.max(d.value ?? 1, 1))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

    const root = d3.pack<NoArvore>()
      .size([W, H])
      .padding(8)(hier)

    const allNodes = root.descendants()

    // ── 2. Estado do zoom ──────────────────────────────────
    let focus: d3.HierarchyCircularNode<NoArvore> = root
    // Começa levemente afastado: raiz visível a ~85% da tela
    let view: [number, number, number] = [root.x, root.y, root.r * 2.3]

    // ── 3. Click no fundo → sobe um nível ─────────────────
    svg.on('click', () => {
      if (focus !== root) zoomToNode(focus.parent ?? root)
    })

    // ── 4. Renderiza nós ───────────────────────────────────
    const nodeG = svg.append('g')
      .selectAll<SVGGElement, d3.HierarchyCircularNode<NoArvore>>('g')
      .data(allNodes)
      .join('g')
      .attr('class', 'zcp-node')

    // Círculos
    const circle = nodeG.append('circle')
      .attr('fill', d => depthColor(d.depth))
      .attr('stroke', 'rgba(255,255,255,0.18)')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .style('opacity', 0)

    circle
      .on('mouseenter', function(_, d) {
        if (d.parent === focus || d === focus) {
          d3.select(this)
            .attr('fill', depthColor(d.depth, true))
            .attr('stroke', 'rgba(255,255,255,0.7)')
            .attr('stroke-width', 2.5)
        }
      })
      .on('mouseleave', function(_, d) {
        d3.select(this)
          .attr('fill', depthColor(d.depth))
          .attr('stroke', 'rgba(255,255,255,0.18)')
          .attr('stroke-width', 1.5)
      })
      .on('click', (event, d) => {
        event.stopPropagation()
        const nd = d.data as any
        if (nd.type === 'campanha') {
          onLeafClick(nd)
          return
        }
        if (d === focus && focus !== root) {
          zoomToNode(focus.parent ?? root)
        } else {
          zoomToNode(d)
        }
      })

    // Labels — texto dentro de cada bolha
    const label = nodeG.append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('pointer-events', 'none')
      .style('opacity', 0)

    // Popula o conteúdo de cada label
    allNodes.forEach(d => {
      const textEl = nodeG.filter(n => n === d).select<SVGTextElement>('text')
      buildLabel(textEl, d)
    })

    // ── 5. zoomApply: reposiciona tudo para a view atual ──
    function zoomApply(v: [number, number, number]) {
      const k = Math.min(W, H) / v[2]
      view = v

      nodeG.attr('transform', d =>
        `translate(${W / 2 + (d.x - v[0]) * k},${H / 2 + (d.y - v[1]) * k})`
      )
      circle.attr('r', d => d.r * k)

      // Tamanho de fonte para nós não-raiz proporcional ao r escalado
      nodeG.filter(d => d !== root).select('text')
        .each(function(d) {
          const r = d.r * k
          const fs = Math.max(10, Math.min(r * 0.28, 22))
          d3.select(this).attr('font-size', fs + 'px')
        })

      // Fonte raiz proporcional ao r da raiz escalado
      const rootR = root.r * k
      const rootFs = Math.max(16, Math.min(rootR * 0.09, 40))
      const kpiFs  = Math.max(10, Math.min(rootR * 0.05, 18))
      nodeG.filter(d => d === root).select('text')
        .attr('transform', `translate(0,${-rootR * 0.18})`)
        .select('tspan.root-title')
        .attr('font-size', rootFs + 'px')
      nodeG.filter(d => d === root).select('text')
        .selectAll<SVGTSpanElement, unknown>('tspan.root-kpi')
        .attr('font-size', kpiFs + 'px')
    }

    // ── 6. zoomToNode: anima zoom + controla opacidade ────
    function zoomToNode(d: d3.HierarchyCircularNode<NoArvore>) {
      focus = d
      const targetView: [number, number, number] = [d.x, d.y, d.r * 2]

      const t = svg.transition().duration(750).ease(d3.easeCubicInOut)

      // Interpolação suave de zoom via d3.interpolateZoom
      t.tween('zoom', () => {
        const interp = d3.interpolateZoom(view, targetView)
        return (time: number) => zoomApply(interp(time) as [number, number, number])
      })

      // Opacidade: raiz sempre visível, filhos do foco visíveis
      circle.transition(t).style('opacity', n => {
        if (n.depth === 0) return 1                   // raiz = bg sempre
        if (n === d) return 1                          // nó focado
        if (n.parent === d) return 1                   // filhos diretos
        if (d.ancestors().slice(1).includes(n)) return 0.2  // ancestrais
        return 0                                       // todo o resto
      })

      // Rótulos: visíveis para filhos diretos do foco
      label.transition(t).style('opacity', n => {
        if (n === root) return d === root ? 1 : 0
        return n.parent === d ? 1 : 0
      })
    }

    // ── 7. Estado inicial ──────────────────────────────────
    zoomApply(view)

    // Raiz cresce do centro com animação
    circle.filter(d => d === root)
      .attr('r', 0)
      .style('opacity', 1)
      .transition()
      .duration(900)
      .ease(d3.easeCubicOut)
      .attr('r', root.r * (Math.min(W, H) / view[2]))

    // Label da raiz aparece após círculo crescer
    label.filter(d => d === root)
      .transition()
      .delay(600)
      .duration(600)
      .style('opacity', 1)

    return () => { svg.selectAll('*').remove() }
  }, [data, onLeafClick])

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}

// ── Helpers de label ───────────────────────────────────────────────────────────

function buildLabel(
  sel: d3.Selection<SVGTextElement, d3.HierarchyCircularNode<NoArvore>, SVGGElement, unknown>,
  d: d3.HierarchyCircularNode<NoArvore>,
) {
  const nd = d.data as any

  if (d.depth === 0) {
    // Raiz: GEOTHRA + KPIs
    const kpis = nd.kpis ?? {}
    sel.attr('dominant-baseline', 'middle')

    sel.append('tspan')
      .attr('class', 'root-title')
      .attr('x', 0).attr('dy', '0')
      .attr('font-weight', '900')
      .attr('letter-spacing', '3')
      .text('GEOTHRA')

    const linhas = [
      `${kpis.clientes ?? 0} clientes`,
      `${kpis.obras ?? 0} obras`,
      `${kpis.campanhas ?? 0} campanhas`,
      `${kpis.rdos_aprovados ?? 0} RDOs`,
      `${(kpis.metros_executados ?? 0).toLocaleString('pt-BR')} m`,
    ]
    linhas.forEach((linha, i) => {
      sel.append('tspan')
        .attr('class', 'root-kpi')
        .attr('x', 0)
        .attr('dy', i === 0 ? '2.5em' : '1.5em')
        .attr('font-weight', '400')
        .attr('fill', 'rgba(255,255,255,0.6)')
        .text(linha)
    })
  } else {
    // Nós filhos: nome + subtítulo opcional
    const name = nd.name || nd.codigo || '?'
    const maxChars = Math.max(8, Math.floor(d.r / 5.5))
    const display = truncate(name, maxChars)

    sel.attr('dominant-baseline', 'middle')
    sel.append('tspan')
      .attr('x', 0)
      .attr('dy', nd.kpis && d.r > 50 ? '-0.6em' : '0')
      .attr('font-weight', '700')
      .text(display)

    // Subtítulo compacto com primeiro KPI disponível
    if (nd.kpis && d.r > 50) {
      const kpiEntries = Object.entries(nd.kpis as Record<string, number>)
      const [kpiKey, kpiVal] = kpiEntries[0] ?? []
      if (kpiKey) {
        sel.append('tspan')
          .attr('x', 0)
          .attr('dy', '1.5em')
          .attr('font-weight', '400')
          .attr('fill', 'rgba(255,255,255,0.55)')
          .text(`${kpiVal} ${kpiKey}`)
      }
    }
  }
}
