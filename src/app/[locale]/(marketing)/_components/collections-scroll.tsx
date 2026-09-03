'use client'

import {useRef, useEffect} from 'react'

type Props = {
    children: React.ReactNode
}

export function CollectionsScroll({children}: Props) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = ref.current
        if (!container) return

        let isDown = false
        let startX = 0
        let scrollLeft = 0
        let velocity = 0
        let lastX = 0
        let raf = 0
        let dragged = false
        let stretch = 0  // current visual overshoot in px

        const maxScroll = () => container.scrollWidth - container.clientWidth

        // Visual slingshot: shift the whole strip with resistance and a cap
        const setStretch = (px: number) => {
            stretch = px
            const shift = Math.sign(px) * Math.min(Math.abs(px) * 0.25, 36)
            container.style.transition = 'none'
            container.style.transform = shift === 0 ? '' : `translateX(${-shift}px)`
        }

        const snapBack = () => {
            if (stretch === 0) return
            stretch = 0
            container.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
            container.style.transform = ''
        }

        const smoothScroll = () => {
            if (!isDown && Math.abs(velocity) > 0.3) {
                container.scrollLeft += velocity
                velocity *= 0.94
                raf = requestAnimationFrame(smoothScroll)
            } else {
                snapBack()
            }
        }

        const stopScroll = () => {
            if (!isDown) return
            isDown = false
            container.style.cursor = 'grab'
            cancelAnimationFrame(raf)

            if (stretch !== 0) {
                // released while stretching — slingshot back, no momentum
                velocity = 0
                snapBack()
            } else {
                smoothScroll()
            }

            if (dragged) {
                document.addEventListener('click', (e) => {
                    e.stopPropagation()
                    e.preventDefault()
                }, {capture: true, once: true})
            }
        }

        const onMouseDown = (e: MouseEvent) => {
            isDown = true
            dragged = false
            container.style.cursor = 'grabbing'
            container.style.transition = 'none'
            startX = e.pageX
            lastX = e.pageX
            scrollLeft = container.scrollLeft
            velocity = 0
            stretch = 0
            cancelAnimationFrame(raf)
        }

        const onMouseMove = (e: MouseEvent) => {
            if (!isDown) return
            e.preventDefault()
            const dx = e.pageX - startX
            if (Math.abs(dx) > 4) dragged = true
            velocity = lastX - e.pageX
            lastX = e.pageX

            const target = scrollLeft - dx
            const max = maxScroll()

            if (target < 0) {
                container.scrollLeft = 0
                setStretch(target)  // negative: dragging past left edge
            } else if (target > max) {
                container.scrollLeft = max
                setStretch(target - max)  // positive: dragging past right edge
            } else {
                container.scrollLeft = target
                setStretch(0)
            }
        }

        const onTouchStart = (e: TouchEvent) => {
            isDown = true
            dragged = false
            container.style.transition = 'none'
            startX = e.touches[0].pageX
            lastX = e.touches[0].pageX
            scrollLeft = container.scrollLeft
            velocity = 0
            stretch = 0
            cancelAnimationFrame(raf)
        }

        const onTouchMove = (e: TouchEvent) => {
            if (!isDown) return
            e.preventDefault()
            const dx = e.touches[0].pageX - startX
            if (Math.abs(dx) > 4) dragged = true
            velocity = lastX - e.touches[0].pageX
            lastX = e.touches[0].pageX

            const target = scrollLeft - dx
            const max = maxScroll()

            if (target < 0) {
                container.scrollLeft = 0
                setStretch(target)
            } else if (target > max) {
                container.scrollLeft = max
                setStretch(target - max)
            } else {
                container.scrollLeft = target
                setStretch(0)
            }
        }

        const preventDrag = (e: DragEvent) => e.preventDefault()

        container.addEventListener('mousedown', onMouseDown)
        container.addEventListener('mousemove', onMouseMove)
        container.addEventListener('dragstart', preventDrag)
        document.addEventListener('mouseup', stopScroll)
        document.addEventListener('mouseleave', stopScroll)
        container.addEventListener('touchstart', onTouchStart, {passive: true})
        container.addEventListener('touchend', stopScroll)
        container.addEventListener('touchmove', onTouchMove, {passive: false})

        return () => {
            container.removeEventListener('mousedown', onMouseDown)
            container.removeEventListener('mousemove', onMouseMove)
            container.removeEventListener('dragstart', preventDrag)
            document.removeEventListener('mouseup', stopScroll)
            document.removeEventListener('mouseleave', stopScroll)
            container.removeEventListener('touchstart', onTouchStart)
            container.removeEventListener('touchend', stopScroll)
            container.removeEventListener('touchmove', onTouchMove)
            cancelAnimationFrame(raf)
        }
    }, [])

    return (
        <div ref={ref} className="collections-scroll" style={{cursor: 'grab', userSelect: 'none'}}>
            {children}
        </div>
    )
}
