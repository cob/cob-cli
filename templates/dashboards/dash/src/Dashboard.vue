<template>
    <div :class="'flex ' + maxWidthClass">
        <BoardsPage class="w-full h-full" :grid-cols="gridColumns">
            <Board 
                v-for="(board,i) in boards" 
                    :key="'board-' + i" 
                    :title="board.title"
                    :row-span="board.rowSpan" 
                    :col-span="board.colSpan"
                >
                <template v-for="(component, i) in board.components">
                    <Totals v-if="component.type == 'Totals'" :component-data="component.data" :key="'component-' + i" />
                    <Menu   v-if="component.type == 'Menu'"   :component-data="component.data" :key="'component-' + i" />
                    <Title  v-if="component.type == 'Title'"  :component-data="component.data" :key="'component-' + i" />
                </template>
            </Board>
        </BoardsPage>
    </div>
</template>

<script>
import BoardsPage from './components/BoardsPage.vue'
import Board from './components/Board.vue'
import Totals from './components/Totals.vue'
import Menu from './components/Menu.vue'
import Title from './components/Title.vue'

export default {
    components: { BoardsPage, Board, Totals, Menu, Title },
    props: { dashboard: Object },
    computed: {
        gridColumns() { 
            return this.dashboard['Grid Columns'] 
        },
        maxWidth() {
            return this.dashboard['Max Width'] 
        },
        boards() {
            return this.dashboard['Board Title'].map( b => ({
                title: b['Board Title'],
                rowSpan: b['Row Span'],
                colSpan: b['Col Span'],
                components: b['Component'].map( c => ({
                    type: c['Component'],
                    data: c

                }))
            }))
        },

        maxWidthClass() {
            // The full class name lookup is important for tailwind to build all classes
            const lookup = {
                "xl": "max-w-xl",
                "2xl": "max-w-2xl",
                "3xl": "max-w-3xl",
                "4xl": "max-w-4xl",
                "5xl": "max-w-5xl",
                "6xl": "max-w-6xl",
                "full": "max-w-full"
            }
            return "mx-auto " + lookup[this.maxWidth]
        }
    }
}
</script>
