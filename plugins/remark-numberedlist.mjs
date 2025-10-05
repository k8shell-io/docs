import { visit } from 'unist-util-visit';

export default function remarkNumberedList() {
    return (tree) => {
        visit(tree, 'containerDirective', (node) => {
            if ((node.name || '').toLowerCase() === 'numberedlist' || node.name?.toLowerCase() === 'numbered') {
                node.data ??= {};
                node.data.hName = 'div';
                node.data.hProperties = {
                    className: ['numbered-list'], // wrapper class we’ll style with CSS counters
                };
            }
        });
    };
}