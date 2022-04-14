<template>
    <div :class="'flex ' + maxWidthClass">
        <!-- <BoardsNav class="w-48" /> and pl-2 on the page -->
        <BoardsPage class="w-full h-full" :grid-cols="dashboard.grid_cols">
            <Board 
                v-for="board in dashboard.boards" 
                :key="board.board_title" 
                :title="board.board_title" :show-title="board.show_board_title" :row-span="board.row_span" :col-span="board.col_span">
                <template v-for="(component, i) in board.components">
                    <Totals v-if="component.component_type == 'Totals'" :component-data="component" :key="component.component_type + i" />
                    <Menu v-if="component.component_type == 'Menu'"     :component-data="component" :key="component.component_type + i" />
                    <Title v-if="component.component_type == 'Title'"   :component-data="component" :key="component.component_type + i" />
                </template>
            </Board>
        </BoardsPage>
    </div>
</template>

<script>
import BoardsNav from './components/BoardsNav.vue'
import BoardsPage from './components/BoardsPage.vue'
import Board from './components/Board.vue'
import Totals from './components/Totals.vue'
import Menu from './components/Menu.vue'
import Title from './components/Title.vue'

export default {
    components: { BoardsNav, BoardsPage, Board, Totals, Menu, Title },
    props: { dashboard: Object },
    computed: {
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
            return "mx-auto " + lookup[this.dashboard.max_width]
        }
    }
}
</script>
